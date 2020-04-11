import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

import config from "../config/config";

/**
 * Summary. This middleware will be called on every route that requires a logged user.
 *
 * Description.
 * 	Check if a valid JWT is on the request header.
 *  If the token is valid, call the next function that will be handled by the controller.
 *  Otherwise, send a response with the 401 (unauthorized) status code.
 */
export const checkJwt = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	// ? Check Authorization header
	if(
		!req.headers.Authorization ||
		!req.headers.Authorization.startsWith('Bearer ')
	) {
		res.status(400).send("Invalid authorization header");
		return;
	}

	let token: string;
	// ? Get the jwt token from the head
	try {
		token = req.headers.Authorization.split('Bearer ')[1];
	}
	catch (error) {
		res.status(401).send("Authorization token is required");
		return;
	}

	// ? Try to validate the token and get data
	try {
		const jwtPayload = jwt.verify(token, config.jwtSecret) as any;
		res.locals.jwtPayload = jwtPayload;
	}

	// ? If token is not valid, respond with 401 (unauthorized)
	catch (error) {
		res.status(401).send("Invalid authorization token");
		return;
	}

	// ? Call the next middleware or controller
	next();
};
