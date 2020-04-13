import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';

import { User } from '../models/User';

/**
 * Summary. This middleware will be called on private routes based on user roles.
 */
export const checkRole = (roles: string[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		// ? Get the user ID from previous middleware
		const id = res.locals.jwtPayload.userId;

		// ? Get user role from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		} catch (error) {
			res.status(401).send();
		}

		// ? Check if array of authorized roles includes the user's role
		roles.includes(user.role) ? next() : res.status(401).send();
	};
};
