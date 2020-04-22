import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import ValidatePassword = require('validate-password');

import { User } from './models/User';
import { Application, Database } from './lib';

/** returns a password validation schema */
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

/** memoization of private key into memory */
export const getJwtCertificates = (function () {
	const certificates = {
		key: null,
		cert: null
	};
	function decodeCertificate(file: string): string {
		let cert = fs.readFileSync(file, 'base64');
		let b64 = Buffer.from(cert, 'base64').toString('ascii');
		return Buffer.from(b64, 'base64').toString('utf-8');
	}
	return () => {
		if (!(certificates.cert && certificates.key)) {
			certificates.cert = decodeCertificate('public.cert');
			certificates.key = decodeCertificate('private.key');
		}
		return certificates;
	};
})();

/** sign JWT with private key */
export function signToken(user: User): string {
	const payload = { userId: user.id };
	const { key } = getJwtCertificates();
	return jwt.sign(payload, key, {
		algorithm: 'RS256',
		expiresIn: process.env.TOKEN_LIFETIME
	});
}

/** Establish connections and load resources */
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
