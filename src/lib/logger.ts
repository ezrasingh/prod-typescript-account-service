import { Request, Response, RequestHandler } from 'express';
import * as morgan from 'morgan';

class Logger {
	private format: string;

	constructor(format: string) {
		this.format = format;
		// ? Depends on request Id middleware
		morgan.token('id', (req: Request & { id: string }) => req.id);
	}

	public error(): RequestHandler {
		return morgan(this.format, {
			skip: function (req: Request, res: Response) {
				return res.statusCode < 400 || req.app.locals.env === 'testing';
			},
			stream: process.stderr
		});
	}

	public status(): RequestHandler {
		return morgan(this.format, {
			skip: function (req: Request, res: Response) {
				return res.statusCode >= 400 || req.app.locals.env === 'testing';
			},
			stream: process.stdout
		});
	}
}

export default Logger;
