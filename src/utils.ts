import * as jwt from 'jsonwebtoken';
import ValidatePassword = require('validate-password');

import { User } from './models/User';
import { Application, Database } from './lib';

export function generatePasswordSchema(): ValidatePassword {
	return new ValidatePassword({
		enforce: {
			lowercase: process.env.PASSWORD_ENFORCE_LOWERCASE === 'true',
			uppercase: process.env.PASSWORD_ENFORCE_UPPERCASE === 'true',
			specialCharacters: process.env.PASSWORD_ENFORCE_SYMBOLS === 'true',
			numbers: process.env.PASSWORD_ENFORCE_NUMBERS === 'true'
		}
	});
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
		await db.connect();
		// tslint:disable-next-line:no-console
		console.log('Connected OK!');
	} catch (error) {
		// console.log(error);
		throw new Error('Could not establish connection to database');
	}

	// tslint:disable-next-line:no-console
	console.log('Starting server...');
	try {
		app.start();
	} catch (error) {
		// console.log(error);

		throw new Error('Could not start application');
	}
}
