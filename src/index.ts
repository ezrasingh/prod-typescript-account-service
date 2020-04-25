import 'reflect-metadata';
import * as dotenv from 'dotenv';

import { Application, Database } from './lib';

if (process.env.NODE_ENV !== 'production') {
	dotenv.config();
	// console.log(process.env)
}

// ? initialize resources
export const app = new Application(+process.env.PORT);

export const db = new Database(
	+process.env.DB_CONNECTION_RETRIES,
	+process.env.DB_CONNECTION_WAIT,
);

/** driver code to startup runtime */
async function run() {
	try {
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
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.log('Service failed to run');
		process.exit(1);
	}
}

/** driver code to handle graceful shutdown */
async function shutdown() {
	try {
		// tslint:disable-next-line:no-console
		console.log('Stopping server...');
		await app.stop();

		// tslint:disable-next-line:no-console
		console.log('Disconnecting from database...');
		await db.disconnect();
	} catch (error) {
		// console.log(error);

		// tslint:disable-next-line:no-console
		console.warn('Could not close the app gracefully: ', error);
		process.exit(1);
	} finally {
		process.exit();
	}
}

/** driver code to handle process life cycle */
if (process.env.NODE_ENV !== 'testing') {
	if (process.argv.includes('start')) {
		run();
	}
	// ? close process gracefully
	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
