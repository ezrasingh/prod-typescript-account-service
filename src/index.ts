import 'reflect-metadata';
import { Connection } from 'typeorm';
import * as dotenv from 'dotenv';

import { startServer, shutdownServer } from './utils';
import Application from './app';

dotenv.config();

// ? initialize resources
const app = new Application();
let db: Connection;

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
