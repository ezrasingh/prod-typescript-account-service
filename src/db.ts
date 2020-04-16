import {
	Connection,
	ConnectionOptions,
	ConnectionManager,
	getConnectionManager,
	getConnectionOptions
} from 'typeorm';

class Database {
	public connection: Connection;
	public connectionManager: ConnectionManager;
	private connectionOptions: ConnectionOptions;
	private maxConnectionRetries: number;
	private reconnectionWaitTime: number;

	constructor(maxReconnectionRetries: number, reconnectionWaitTime: number) {
		this.maxConnectionRetries = maxReconnectionRetries;
		this.reconnectionWaitTime = reconnectionWaitTime;
		this.connectionManager = getConnectionManager();
	}

	public establishConnections = async () => {
		if (!this.connectionManager.has('default')) {
			this.connectionOptions = await getConnectionOptions();
			this.connectionManager.create(this.connectionOptions);
		}
	};

	public loadConnections = async () => {
		this.connection = this.connectionManager.get();
		let retries = this.maxConnectionRetries;
		while (retries) {
			try {
				await this.connection.connect();
				break;
			} catch (error) {
				retries -= 1;
				// tslint:disable-next-line:no-console
				console.log(
					`Connection failed attempt: ${retries}/${this.maxConnectionRetries}`
				);
				await new Promise(res => {
					setTimeout(res, this.reconnectionWaitTime * 1000);
				});
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
				retries -= 1;
				// tslint:disable-next-line:no-console
				console.log(
					`Disconnection failed attempt: ${retries}/${this.maxConnectionRetries}`
				);
				await new Promise(res =>
					setTimeout(res, this.maxConnectionRetries * 1000)
				);
			}
		}
	};
}

export default Database;
