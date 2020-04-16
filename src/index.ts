import 'reflect-metadata';
import * as dotenv from 'dotenv';

import { startServer, shutdownServer } from './utils';
import Application from './app';
import Database from './db';

dotenv.config();

// ? initialize resources
const app = new Application(+process.env.PORT);

const db = new Database(
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

if (process.argv.includes('run')) {
	run();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
export { db };
