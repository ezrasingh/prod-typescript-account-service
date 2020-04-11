import * as jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { IControllerHandler } from "./types";
import { User } from "../models/User";
import config from "../config/config";

class AuthController {
	static login = async (handler: IControllerHandler) => {
		const { req, res } = handler;

		// ? Check if username and password are set
		const { username, password } = req.body;
		if(!(username && password)) {
			res.status(400).send();
		}

		// ? Get user from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail({ where: { username }});
		}
		catch (error) {
			res.status(401).send();
		}

		// ? check if password is valid
		if(!user.verifyPassword(password)) {
			res.status(401).send();
			return;
		}

		// ? sign JWT, valid for 1hr
		const token = jwt.sign(
			{ userId: user.id, username: user.username },
			config.jwtSecret,
			{ expiresIn: '1h' }
		);

		// ? send token in response
		res.send(token);
	};

	static changePassword = async (handler: IControllerHandler) => {
		const { req, res } = handler;

		// ? Get ID from JWT
		const id = res.locals.jwtPayload.userId;

		// ? Get parameters from the body
		const { oldPassword, newPassword } = req.body;
		if(!(oldPassword && newPassword)) {
			res.status(400).send();
		}

		// ? Get user from the db
		const userRespository = getRepository(User);
		let user: User;
		try {
			user = await userRespository.findOneOrFail(id);
		}
		catch (id) {
			res.status(401).send();
		}

		// ? check if old password is valid
		if(!(user.verifyPassword(oldPassword))){
			res.status(401).send();
			return;
		}

		// ? Validate password policy
		user.password = newPassword;
		const errors = await validate(user);
		if(errors.length > 0) {
			res.status(400).send(errors);
			return;
		}

		// ? hash new password and persist changes
		user.hashPassword();
		userRespository.save(user);

		res.status(204).send();
	};
}

export default AuthController;
