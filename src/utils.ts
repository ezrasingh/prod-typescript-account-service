import * as jwt from 'jsonwebtoken';
import { createHttpTerminator, HttpTerminatorType } from 'http-terminator';
import {
	getConnectionManager,
	getConnectionOptions,
	Connection
} from 'typeorm';
import passwordValidator = require('password-validator');

import { User } from './models/User';
import Application from './app';

const PORT: number = +process.env.PORT || 5000;

export function generatePasswordSchema(): passwordValidator {
	let schema = new passwordValidator();

	if (process.env.PASSWORD_MIN_LEN) {
		schema = schema.is().min(+process.env.PASSWORD_MIN_LEN);
	}

	if (process.env.PASSWORD_MAX_LEN) {
		schema = schema.is().max(+process.env.PASSWORD_MAX_LEN);
	}

	if (process.env.PASSWORD_HAS_UPPERCASE) {
		schema = schema.has().uppercase();
	}

	if (process.env.PASSWORD_HAS_LOWERCASE) {
		schema = schema.has().lowercase();
	}

	if (process.env.PASSWORD_HAS_DIGITS) {
		schema = schema.has().digits();
	}

	if (!process.env.PASSWORD_HAS_SPACES) {
		schema = schema.has().not().spaces();
	}

	return schema;
}

export function generateToken(user: User, signature: string): string {
	const payload = {
		userId: user.id,
		email: user.email
	};
	return jwt.sign(payload, signature, {
		expiresIn: process.env.TOKEN_LIFETIME
	});
}

export async function startServer(
	app: Application,
	db: Connection
): Promise<void> {
	const connectionManager = getConnectionManager();

	if (!connectionManager.has('default')) {
		const connectionOptions = await getConnectionOptions();
		connectionManager.create(connectionOptions);
	}

	try {
		db = connectionManager.get();
		// tslint:disable-next-line:no-console
		console.log('Connecting to database...');
		await db.connect();
		// tslint:disable-next-line:no-console
		console.log('Connected OK!');
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.log(error);
		return;
	}

	// tslint:disable-next-line:no-console
	console.log('Starting server');
	app.start(PORT);
}

export async function shutdownServer(
	app: Application,
	db: Connection
): Promise<void> {
	// tslint:disable-next-line:no-console
	console.log('Disconnecting from database');
	await db.close();

	const httpTerminator: HttpTerminatorType = createHttpTerminator({ server: app.listener });
	// tslint:disable-next-line:no-console
	console.log('Closing server');
	await httpTerminator.terminate();
}
