import { Server } from 'http';
import { Request, Response, RequestHandler } from 'express';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as requestId from 'express-request-id';

import Logger from './logger';
import routes from './routes';

class Application {
	public server: express.Application;
	public listener: Server;
	private logger: Logger;

	constructor() {
		this.server = express();
		this.logger = new Logger(':id :method :url :status :res[content-length] - :response-time ms');
		this.generateJwtSecret();
		this.middleware();
		this.routes();
	}

	/** attach server to port and begin listening for request */
	public start(port: number): void{
		try {
			this.listener = this.server.listen(port, () => {
				// tslint:disable-next-line:no-console
				console.log(`Server listening on port: ${this.listener.address().port}`);
			});
		} catch (error) {
			// tslint:disable-next-line:no-console
			console.log(error);
		}
	}

	private generateJwtSecret(): void{
		const key: string[] =
			[ ...Array(process.env.SECRET_KEY_SIZE) ]
			.map(_i => Math.random().toString(36).substring(2));
		this.server.locals.jwtSecret = key.join('')
	}

	private middleware(): void {
		this.server.use(cors());
		this.server.use(helmet());
		this.server.use(bodyParser.json());
		this.server.use(requestId());
		this.server.use(this.logger.error());
		this.server.use(this.logger.status());
	}

	private healthCheckHandler(_req: Request, res: Response): RequestHandler {
		res.json({
			status: 'UP',
			environment: process.env.NODE_ENV
		});
		return;
	}

	private routes(): void {
		this.server.use('/health', this.healthCheckHandler);
		this.server.use('/api', routes);
	}
}

export default Application;
