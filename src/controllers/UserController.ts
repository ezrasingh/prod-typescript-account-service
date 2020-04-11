import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../models/User";

class UserController {
	static listAll = async (req: Request, res: Response) => {
		// ? Get users from db
		const userRepository = getRepository(User);
		let users: User[];
		users = await userRepository.find({
			// ! DO NOT INCLUDE PASSWORD IN SELECTION QUERY
			select: [ "id", "username", "role" ]
		})

		res.send(users);
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
				select: [ "id", "username", "role" ]
			});
		}
		catch (error) {
			res.status(404).send("User not found");
		}

		res.send(user);
	};

	static createUser = async (req: Request, res: Response) => {
		// ? Get parameters from the body
		const { username, password, role } = req.body;
		const user = new User();
		user.username = username;
		user.password = password;
		user.role = role;

		// ? Validate user entry
		const errors = await validate(user);
		if(errors.length > 0) {
			res.status(400).send(errors);
			return;
		}

		// ? Hash password to securely store credentials
		user.hashPassword();

		// ? Try to store user, else username is already taken
		const userRepository = getRepository(User);
		try {
			await userRepository.save(user);
		}
		catch (error) {
			res.status(409).send("username already in use");
			return;
		}

		res.status(201).send("user created");
	};

	static updateUser = async (req: Request, res: Response) => {
		// ? Get ID from URL
		const id: number = +req.params.id;

		// ? Get parameters from body
		const { username, role } = req.body;

		// ? Try to find user in db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		}
		catch (error) {
			res.status(404).send("User not found");
			return;
		}

		// ? Validate updated values on the model
		user.username = username;
		user.role = role;
		const errors = await validate(user);
		if(errors.length > 0) {
			res.status(400).send(errors);
			return;
		}

		// ? Try to store user, else username is already taken
		try {
			await userRepository.save(user);
		}
		catch (error) {
			res.status(409).send("username already in use");
			return;
		}

		res.status(204).send();
	};

	static deleteUser = async (req: Request, res: Response) => {
		// ? Get ID from the url
		const id: number = +req.params.url;

		// ? Search for user in db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		}
		catch (error) {
			res.status(404).send("user not found");
			return;
		}

		// ? Remove user from db
		userRepository.delete(id);

		res.status(204).send();
	};
}

export default UserController;

