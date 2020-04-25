import {
	Connection,
	ConnectionManager,
	getConnectionManager,
	ConnectionOptions,
} from 'typeorm';
import models from '../models';

class Database {
	public connection: Connection;
	public connectionManager: ConnectionManager;
	private connectionOptions: ConnectionOptions;

	private maxConnectionRetries: number;
	private reconnectionWaitTime: number;

	constructor(
		maxReconnectionRetries: number,
		reconnectionWaitTime: number,
		dbPrimaryUrl?: string,
		dbReplicas?: string[],
	) {
		this.maxConnectionRetries = maxReconnectionRetries;
		this.reconnectionWaitTime = reconnectionWaitTime;
		this.connectionOptions = {
			type: 'postgres',
			logging: process.env.NODE_ENV !== 'production',
			synchronize: true, // process.env.NODE_ENV !== 'production',
			entities: models,
			schema: process.env.DB_SCHEMA,
		};

		if (dbReplicas && dbReplicas.length > 0) {
			// ? enable replication mode
			this.connectionOptions = {
				...this.connectionOptions,
				replication: {
					master: { url: dbPrimaryUrl },
					slaves: dbReplicas.map((nodeUrl, _id) => {
						return { url: nodeUrl };
					}),
				},
			};
		} else if (dbPrimaryUrl) {
			// ? use URI based connection
			this.connectionOptions = {
				...this.connectionOptions,
				url: dbPrimaryUrl,
			};
		} else {
			// ? default to credentials based connection
			this.connectionOptions = {
				...this.connectionOptions,
				host: process.env.DB_HOST,
				port: +process.env.DB_PORT,
				username: process.env.DB_USERNAME,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_DATABASE,
			};
		}

		this.connectionManager = getConnectionManager();
	}

	public connect = async () => {
		if (!this.connectionManager.has('default')) {
			this.connection = this.connectionManager.create(
				this.connectionOptions as any,
			);
		} else {
			this.connection = this.connectionManager.get('default');
		}

		let retries = this.maxConnectionRetries;
		while (retries) {
			try {
				await this.connection.connect();
				break;
			} catch (error) {
				console.log(error);

				retries -= 1;
				// tslint:disable-next-line:no-console
				console.warn(
					`Connection failed attempt: ${this.maxConnectionRetries - retries}/${
						this.maxConnectionRetries
					}`,
				);
				await new Promise(res => {
					setTimeout(res, this.reconnectionWaitTime * 1000);
				});
				if (retries === 0) {
					throw new Error('Cannot connect to database');
				}
			}
		}
	};

	public sync = () => {
		this.connectionManager.create({
			...this.connectionOptions,
			synchronize: true,
		} as any);
	};

	public disconnect = async () => {
		let retries = this.maxConnectionRetries;
		while (retries) {
			try {
				this.connectionManager.connections.forEach(async function (connection) {
					if (connection.isConnected) {
						await connection.close();
					}
				});
				break;
			} catch (error) {
				// console.log(error); break;

				retries -= 1;
				// tslint:disable-next-line:no-console
				console.log(
					`Disconnection failed attempt: ${
						this.maxConnectionRetries - retries
					}/${this.maxConnectionRetries}`,
				);
				await new Promise(res =>
					setTimeout(res, this.maxConnectionRetries * 1000),
				);
			}
		}
	};
}

export default Database;
