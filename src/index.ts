import 'reflect-metadata';
import * as dotenv from 'dotenv';

import { startServer, shutdownServer } from './utils';
import Application from './app';
import Database from './db';

dotenv.config();

// ? initialize resources
export const app = new Application(+process.env.PORT);

export const db = new Database(
	+process.env.DB_CONNECTION_RETRIES,
	+process.env.DB_CONNECTION_WAIT
);

/** driver code to handle graceful start */
async function run() {
	await startServer(app, db);
}

/** driver code to handle graceful stop */
async function shutdown() {
	await shutdownServer(app, db);
}

/** driver code to handle process lifecycle */
if (process.env.NODE_ENV !== 'testing') {
	if (process.argv.includes('start')) {
		run();
	}
	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
