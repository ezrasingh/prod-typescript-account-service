import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';

import { User } from '../models/User';

/**
 * Summary. This middleware will be called on RBAC protected routes
 */
export const checkRole = (roles: string[]) => {
	return async (_req: Request, res: Response, next: NextFunction) => {
		// ? Get the user ID from previous middleware
		const id = res.locals.jwtPayload.userId;

		// ? Get user role from db
		const userRepository = getRepository(User);
		let user: User;
		try {
			user = await userRepository.findOneOrFail(id);
		} catch (error) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send();
			return;
		}

		// ? Check if the user's role is included in allowed roles
		if (!roles.includes(user.role)) {
			// ! fail quietly to minimize
			// ! surface area of a brute force attack
			res.status(401).send();
			return;
		}

		next();
	};
};
