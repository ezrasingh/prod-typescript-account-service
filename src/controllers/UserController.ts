import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';

import { User } from '../models/User';

class UserController {
	static listAll = async (_req: Request, res: Response) => {
		// ? Get users from db
		const userRepository = getRepository(User);
		let users: User[];
		users = await userRepository.find({
			// ! DO NOT INCLUDE PASSWORD IN SELECTION QUERY
			select: ['id', 'email', 'role']
		});

		res.send({ users });
	};

	static getUser = async (req: Request, res: Response) => {
		// ? Get ID from URL
		const id: number = +req.params.id;

		// ? Get user from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id, {
				// ! DO NOT INCLUDE PASSWORD IN SELECTION QUERY
				select: ['id', 'email', 'role']
			});
		} catch (error) {
			res.status(404).send('User not found');
		}

		res.send({ user });
	};

	static createUser = async (req: Request, res: Response) => {
		// ? get parameters from the body
		const { email, password, role } = req.body;
		const user = new User();
		user.email = email;
		user.password = password;
		user.role = role;

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
			res.status(409).send('email already in use');
			return;
		}

		res.status(201).send('user created');
	};

	static updateUser = async (req: Request, res: Response) => {
		// ? Get ID from URL
		const id: number = +req.params.id;

		// ? Get parameters from body
		const { email, role } = req.body;

		// ? Try to find user in db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		} catch (error) {
			res.status(404).send('User not found');
			return;
		}

		// ? Validate updated values on the model
		user.email = email;
		user.role = role;
		const errors = await validate(user);
		if (errors.length > 0) {
			res.status(400).send({ errors });
			return;
		}

		// ? Try to store user, else username is already taken
		try {
			await userRepository.save(user);
		} catch (error) {
			res.status(409).send('username already in use');
			return;
		}

		res.status(204).send();
	};

	static deleteUser = async (req: Request, res: Response) => {
		// ? Get ID from the url
		const id: number = +req.params.url;

		if (!id) {
			res.status(400).send('no user selected');
		}

		// ? Search for user in db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		} catch (error) {
			res.status(404).send('user not found');
			return;
		}

		// ? Remove user from db
		userRepository.delete(user);

		res.status(204).send();
	};

	static whoami = async (req: Request, res: Response) => {
		// ? retrieve user Id from JWT payload
		const { userId } = res.locals.jwtPayload;

		// ? Get user from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(userId, {
				// ! DO NOT INCLUDE PASSWORD IN SELECTION QUERY
				select: ['id', 'email', 'role']
			});
		} catch (error) {
			res.status(404).send('Invalid user ID');
		}

		res.send({ user });
	};
}

export default UserController;
