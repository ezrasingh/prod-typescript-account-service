import * as jwt from 'jsonwebtoken';
import passwordValidator = require('password-validator');

import { User } from './models/User';
import Application from './app';
import Database from './db';

export function generatePasswordSchema(): passwordValidator {
	let schema = new passwordValidator();

	if (+process.env.PASSWORD_MIN_LEN) {
		schema.is().min(+process.env.PASSWORD_MIN_LEN);
	}

	if (+process.env.PASSWORD_MAX_LEN) {
		schema.is().max(+process.env.PASSWORD_MAX_LEN);
	}

	if (process.env.PASSWORD_HAS_UPPERCASE === 'true') {
		schema.has().uppercase();
	} else {
		schema.has().not().uppercase();
	}

	if (process.env.PASSWORD_HAS_LOWERCASE === 'true') {
		schema.has().lowercase();
	} else {
		schema.has().not().lowercase();
	}

	if (process.env.PASSWORD_HAS_DIGITS === 'true') {
		schema.has().digits();
	}

	if (process.env.PASSWORD_HAS_SPACES === 'true') {
		schema.has().spaces();
	} else {
		schema.has().not().spaces();
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
		throw new Error('Could not establish connection to database');
	}

	// tslint:disable-next-line:no-console
	console.log('Starting server...');
	try {
		app.start();
	} catch (error) {
		throw new Error('Could not start application');
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
