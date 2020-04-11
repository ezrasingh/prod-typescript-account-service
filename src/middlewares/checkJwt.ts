import * as jwt from "jsonwebtoken";

import { IMiddlewareHandler } from "./types";
import config from "../config/config";

/**
 * Summary. This middleware will be called on every route that requires a logged user.
 *
 * Description.
 * 	Check if a valid JWT is on the request header.
 *  If the token is valid, call the next function that will be handled by the controller.
 *  Otherwise, send a response with the 401 (unauthorized) status code.
 */
export const checkJwt = (handler: IMiddlewareHandler) => {
	const { req, res, next } = handler;

	// ? Get the jwt token from the head
	const token: string = req.headers.Authorization as string;
	let jwtPayload;

	// ? Try to validate the token and get data
	try {
		jwtPayload = jwt.verify(token, config.jwtSecret) as any;
		res.locals.jwtPayload = jwtPayload;
	}

	// ? If token is not valid, respond with 401 (unauthorized)
	catch (error) {
		res.status(401).send();
		return;
	}

	// ? The token is valid for 1 hour
  // ? We want to send a new token on every request
	const { userId, username } = jwtPayload;
	const newToken = jwt.sign(
		{ userId, username },
		config.jwtSecret,
		{ expiresIn: "1h"}
	);

	res.setHeader('token', newToken);

	// ? Call the next middleware or controller
	next();
};
