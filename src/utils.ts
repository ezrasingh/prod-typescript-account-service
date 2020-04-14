import * as jwt from 'jsonwebtoken';
import { createHttpTerminator } from 'http-terminator';
import {
	getConnectionManager,
	getConnectionOptions,
	Connection
} from 'typeorm';

import { User } from './models/User';
import Application from './app';

const PORT: number = +process.env.PORT || 5000;

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

	const httpTerminator = createHttpTerminator({ server: app.listener });
	// tslint:disable-next-line:no-console
	console.log('Closing server');
	await httpTerminator.terminate();
}
