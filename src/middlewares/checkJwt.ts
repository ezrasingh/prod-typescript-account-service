import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Summary. This middleware will be called on every route that requires a logged user.
 *
 * Description.
 * 	Check if a valid JWT is on the request header.
 *  If the token is valid, call the next function that will be handled by the controller.
 *  Otherwise, send a response with the 401 (unauthorized) status code.
 */
const checkJwt = (req: Request, res: Response, next: NextFunction) => {
	// ? Handle case-insensitive headers
	if (req.headers.authorization) {
		req.headers.Authorization = req.headers.authorization as string;
	}

	let credentials = req.headers.Authorization as string;

	// ? Check Authorization header
	if (!credentials || !credentials.startsWith('Bearer ')) {
		res.status(400).send({ message: 'invalid authorization header' });
		return;
	}

	let token: string;
	// ? Get the jwt token from the head
	try {
		token = credentials.split('Bearer ')[1];
	} catch (error) {
		res.status(401).send({ message: 'authorization token is required' });
		return;
	}

	// ? Try to validate the token and get data
	try {
		const jwtPayload = jwt.verify(token, req.app.locals.publicKey, {
			algorithms: ['RS256'],
		}) as any;
		res.locals.jwtPayload = jwtPayload;
	} catch (error) {
		// ? If token is not valid, respond with 401 (unauthorized)
		res.status(401).send({ message: 'invalid authorization token' });
		return;
	}

	// ? Call the next middleware or controller
	next();
};

export default checkJwt;
