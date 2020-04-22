import { Connection, ConnectionManager, getConnectionManager } from 'typeorm';
import models from '../models';

class Database {
	public connection: Connection;
	public connectionManager: ConnectionManager;
	private connectionOptions: any;

	private maxConnectionRetries: number;
	private reconnectionWaitTime: number;

	constructor(
		maxReconnectionRetries: number,
		reconnectionWaitTime: number,
		dbMaster: string,
		replicas?: string[]
	) {
		this.maxConnectionRetries = maxReconnectionRetries;
		this.reconnectionWaitTime = reconnectionWaitTime;
		this.connectionOptions = {
			type: 'postgres',
			logging: process.env.NODE_ENV !== 'production',
			synchronize: process.env.NODE_ENV !== 'production',
			entities: models,
			url: dbMaster
		};

		if (replicas.length > 0) {
			this.connectionOptions.replication = {
				master: { url: dbMaster },
				slaves: replicas.map((nodeUrl, _id) => {
					return { url: nodeUrl };
				})
			};
		}

		this.connectionManager = getConnectionManager();
	}

	public connect = async () => {
		if (!this.connectionManager.has('default')) {
			this.connection = this.connectionManager.create(
				this.connectionOptions as any
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
				// console.log(error); break;

				retries -= 1;
				// tslint:disable-next-line:no-console
				console.warn(
					`Connection failed attempt: ${this.maxConnectionRetries - retries}/${
						this.maxConnectionRetries
					}`
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
					}/${this.maxConnectionRetries}`
				);
				await new Promise(res =>
					setTimeout(res, this.maxConnectionRetries * 1000)
				);
			}
		}
	};
}

export default Database;
