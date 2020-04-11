import * as express from "express";
import * as bodyParser from "body-parser";
import * as helmet from "helmet";
import * as cors from "cors";

import routes from "./routes";

class Application {
	public server: express.Application;

	constructor() {
		this.server = express();
		this.middleware();
		this.routes();
	};

	private middleware(): void {
		this.server.use(cors());
		this.server.use(helmet());
		this.server.use(bodyParser.json());
	};

	private routes(): void {
		this.server.use('/', routes);
	};

};

export default Application;
