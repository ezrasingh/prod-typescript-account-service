import * as jwt from 'jsonwebtoken';
import passwordValidator = require('password-validator');

import { User } from './models/User';
import Application from './app';
import Database from './db';

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
	db: Database
): Promise<void> {
	// tslint:disable-next-line:no-console
	console.log('Connecting to database...');
	try {
		await db.establishConnections();
		await db.loadConnections();
		// tslint:disable-next-line:no-console
		console.log('Connected OK!');
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.error('Could not establish connection to database: ', error);
		return;
	}

	// tslint:disable-next-line:no-console
	console.log('Starting server...');
	try {
		app.start();
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.error('Could not start application: ', error);
		return;
	}
}

export async function shutdownServer(
	app: Application,
	db: Database
): Promise<void> {
	try {
		// tslint:disable-next-line:no-console
		console.log('Disconnecting from database');
		await db.disconnect();
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.warn('Could not close the database connection', error);
	}

	try {
		// tslint:disable-next-line:no-console
		console.log('Closing server');
		await app.stop();
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.warn('Could not app close gracefully', error);
	} finally {
		process.exit(1);
	}
}
