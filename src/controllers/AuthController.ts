import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';

import { User } from '../models/User';
import { generateToken } from '../utils';

class AuthController {
	static login = async (req: Request, res: Response) => {
		// ? Check if email and password are set
		const { email, password } = req.body;
		if (!(email && password)) {
			res.status(400).send();
		}

		// ? Get user from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail({ where: { email } });
		} catch (error) {
			res.status(401).send();
		}

		// ? check if password is valid
		if (!user.verifyPassword(password)) {
			res.status(401).send();
			return;
		}

		// ? sign JWT, valid for 1hr
		const token = generateToken(user, req.app.locals.jwtSecret);

		// ? send token in response
		res.send(token);
	};

	static register = async (req: Request, res: Response) => {
		const { email, password, confirmPassword } = req.body;
		// ? check if email and password are set
		if (!(email && password)) {
			res.status(400).send('missing user registration body');
			return;
		}

		// ? check if password matches confirmation password
		if (password !== confirmPassword) {
			res.status(400).send('passwords do not match');
			return;
		}

		// ? build user entity
		const user = new User();
		user.email = email;
		user.password = password;

		// ? validate user entry
		const errors = await validate(user);
		if (errors.length > 0) {
			res.status(400).send(errors);
			return;
		}

		// ? hash password to securely store credentials
		user.hashPassword();

		// ? try to store user, else email is already taken
		const userRepository = getRepository(User);
		try {
			await userRepository.save(user);
		} catch (error) {
			res.status(409).send('email already in use');
			return;
		}

		res.status(201).send('user created');
	};

	static refreshToken = async (req: Request, res: Response) => {
		// ? load user ID from JWT token
		const { userId } = res.locals.jwtPayload;

		// ? load user's contents
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(userId);
		} catch (error) {
			res.status(401).send();
		}

		// ? generate fresh token
		const token = generateToken(user, req.app.locals.jwtSecret);

		// ? send token in response
		res.send(token);
	};

	static changePassword = async (req: Request, res: Response) => {
		// ? Get ID from JWT
		const id = res.locals.jwtPayload.userId;

		// ? Get parameters from the body
		const { oldPassword, newPassword } = req.body;
		if (!(oldPassword && newPassword)) {
			res.status(400).send();
		}

		// ? Get user from the db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		} catch (error) {
			res.status(401).send();
		}

		// ? check if old password is valid
		if (!user.verifyPassword(oldPassword)) {
			res.status(401).send();
			return;
		}

		// ? Validate password policy
		user.password = newPassword;
		const errors = await validate(user);
		if (errors.length > 0) {
			res.status(400).send(errors);
			return;
		}

		// ? hash new password and persist changes
		user.hashPassword();
		userRepository.save(user);

		res.status(204).send();
	};
}

export default AuthController;
