import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';

import { User, UserRole, Profile, Name } from '../models';
import { signToken, generatePasswordSchema } from '../utils';

export const passwordValidator = generatePasswordSchema();

class AuthController {
	static login = async (req: Request, res: Response) => {
		// ? Check if email and password are set
		const { email, password } = req.body;
		if (!(email && password)) {
			res.status(400).send({ message: 'missing request body' });
			return;
		}

		// ? Get user from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail({ where: { email } });
		} catch (error) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send({ message: 'login failed' });
			return;
		}

		// ? check if password is valid
		if (!user.verifyPassword(password)) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send({ message: 'login failed' });
			return;
		}

		// ? update login metrics
		user.lastLogin = new Date();
		user.loginCount += 1;
		userRepository.save(user);

		// ? sign JWT
		const token = signToken(user);

		// ? issue token in response
		res.send({ token });
	};

	static register = async (req: Request, res: Response) => {
		const { email, password, confirmPassword, profile } = req.body;
		// ? check if email and password are set
		if (!(email && password && confirmPassword && profile)) {
			res.status(400).send({ message: 'missing user registration body' });
			return;
		}

		if (!(profile.firstName && profile.lastName)) {
			res.status(400).send({ message: 'missing profile name' });
			return;
		}

		// ? Validate new password
		const passwordValidation = passwordValidator.checkPassword(password);
		if (!passwordValidation.isValid) {
			res.status(401).send({ message: passwordValidation.validationMessage });
			return;
		}

		// ? check if password matches confirmation password
		if (password !== confirmPassword) {
			res.status(400).send({ message: 'passwords do not match' });
			return;
		}

		// ? build user entity and associated profile
		let userProfile: Profile;
		let user: User;
		try {
			const name = new Name();
			name.first = profile.firstName;
			name.last = profile.lastName;

			userProfile = new Profile();
			userProfile.name = name;

			user = new User();
			user.email = email;
			user.password = password;
			user.role = UserRole.CUSTOMER;
			user.profile = userProfile;
		} catch (error) {
			console.log(error);

			res.status(400).send({ message: 'could not register user' });
			return;
		}

		// ? validate user entry
		const errors = await validate(user);
		if (errors.length > 0) {
			res.status(400).send({ errors });
			return;
		}

		// ? hash password to securely store credentials
		user.hashPassword();

		// ? try to store user, else email is already taken
		const userRepository = getRepository(User);
		try {
			await userRepository.save(user);
		} catch (error) {
			res.status(409).send({ message: 'email already in use' });
			return;
		}

		res.status(201).send({ message: 'user created' });
	};

	static refreshToken = async (_req: Request, res: Response) => {
		// ? load user ID from JWT token
		const { userId } = res.locals.jwtPayload;

		// ? load user's contents
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(userId);
		} catch (error) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send({ message: 'refresh token failed' });
			return;
		}

		// ? generate fresh token
		const token = signToken(user);

		// ? send token in response
		res.send({ token });
	};

	static changePassword = async (req: Request, res: Response) => {
		// ? Get ID from JWT
		const { userId } = res.locals.jwtPayload;

		// ? Get parameters from the body
		const { oldPassword, newPassword, confirmPassword } = req.body;
		if (!(oldPassword && newPassword && confirmPassword)) {
			res.status(400).send({ message: 'missing request body' });
			return;
		}

		// ? Validate new password
		const passwordValidation = passwordValidator.checkPassword(newPassword);
		if (!passwordValidation.isValid) {
			res.status(401).send({ message: passwordValidation.validationMessage });
			return;
		}

		// ? check if new password matches confirmation password
		if (newPassword !== confirmPassword) {
			res.status(400).send({ message: 'new passwords do not match' });
			return;
		}

		// ? Get user from the db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(userId);
		} catch (error) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send({ message: 'change password failed' });
			return;
		}

		// ? check if old password is valid
		if (!user.verifyPassword(oldPassword)) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send({ message: 'change password failed' });
			return;
		}

		// ? Validate account payload
		user.password = newPassword;
		const errors = await validate(user);
		if (errors.length > 0) {
			res.status(400).send({ errors });
			return;
		}

		// ? hash new password and persist changes
		user.hashPassword();
		userRepository.save(user);

		res.status(201).send({ message: 'password updated' });
	};
}

export default AuthController;
