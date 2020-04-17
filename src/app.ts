import { Server } from 'http';
import { Request, Response, RequestHandler } from 'express';
import { createHttpTerminator } from 'http-terminator';
import {
	getConnectionManager,
	getConnectionOptions,
	ConnectionManager
} from 'typeorm';
import * as os from 'os';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as requestId from 'express-request-id';

import Logger from './logger';
import routes from './routes';
import { print } from 'util';

type HttpTerminator = { terminate: () => Promise<void> };

class Application {
	public server: express.Application;
	public listener: Server;
	private port: number;
	private logger: Logger;
	private terminator: HttpTerminator;

	constructor(port: number) {
		this.port = port;
		this.server = express();
		this.logger = new Logger(
			':id :method :url :status :res[content-length] - :response-time ms'
		);
		this.server.locals.env = process.env.NODE_ENV;
		this.generateJwtSecret();
		this.middleware();
		this.routes();
	}

	/** attach server to port and begin listening for request */
	public start(): void {
		this.listener = this.server.listen(this.port, () => {
			// tslint:disable-next-line:no-console
			console.log(`Server listening on port: ${this.listener.address().port}`);
		});
		this.terminator = createHttpTerminator({ server: this.listener });
	}

	public stop(): Promise<void> {
		return this.terminator.terminate();
	}

	private generateJwtSecret(): void {
		const secretKey: string[] = [];
		while (secretKey.length !== +process.env.SECRET_KEY_SIZE) {
			secretKey.push(Math.random().toString(36).substring(2));
		}
		this.server.locals.jwtSecret = secretKey.join('');
	}

	private middleware(): void {
		this.server.use(cors());
		this.server.use(helmet());
		this.server.use(bodyParser.json());
		this.server.use(requestId());
		this.server.use(this.logger.error());
		this.server.use(this.logger.status());
	}

	private healthCheckHandler(req: Request, res: Response): RequestHandler {
		res.status(200).send({
			status: 'UP',
			environment: req.app.locals.env,
			uptime: os.uptime()
		});
		return;
	}

	private routes(): void {
		this.server.use('/health', this.healthCheckHandler);
		this.server.use('/api', routes);
	}
}

export default Application;
