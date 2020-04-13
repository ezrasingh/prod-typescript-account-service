import 'reflect-metadata';
import { ConnectionManager, Connection } from 'typeorm';

import Application from './app';

const ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

const connectionManager = new ConnectionManager();
const app = new Application();

function initalizeConnection(): Connection {
	const config = {
		development: () => import('./config/development/database'),
		staging: () => import('./config/staging/database'),
		production: () => import('./config/production/database')
	}
	return connectionManager.create(config[ ENV ]);
}

async function startServer(db: Connection) {
	await db.connect();
	try {
		app.server.listen(PORT, () => {
			// tslint:disable-next-line:no-console
			console.log(`Server stated on port ${PORT}`);
		});
	} catch (error) {
		// tslint:disable-next-line:no-console
		console.log(error);
	}
}

const db = initalizeConnection();

startServer(db);

export default app;
export { db };
