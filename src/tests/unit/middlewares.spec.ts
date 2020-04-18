import { SinonSandbox, createSandbox, fake, SinonStub, stub } from 'sinon';
import * as request from 'supertest';
import 'mocha';

import * as express from 'express';
import { checkJwt, checkRole } from '../../middlewares';
import { generateToken } from '../../utils';
import { User } from '../../models/User';

describe('Middlewares library', () => {
	let mockApp: express.Application;
	let testRouter: express.Router;
	const mockHandler = (_req: express.Request, res: express.Response) => {
		res.status(200).send();
	};

	describe('checkJwt', () => {
		const envStub = stub(process.env, 'TOKEN_LIFETIME').value('1h');
		let requestHook: Function;
		let mockToken: string;

		before(() => {
			mockApp = express();
			testRouter = express.Router();
			mockApp.locals.jwtSecret = 'secret-key';
		});

		beforeEach(() => {
			const mockUser = new User();
			mockUser.id = 123;
			mockUser.email = 'user@app.com';
			mockToken = generateToken(mockUser, mockApp.locals.jwtSecret);

			testRouter.get('/test/checkJwt', [checkJwt], mockHandler);
			mockApp.use(testRouter);

			requestHook = () => {
				return request(mockApp).get('/test/checkJwt');
			};
		});

		after(() => {
			envStub.restore();
		});

		it('should handle case insensitive auth header', async () => {
			await requestHook()
				.set('authorization', `Bearer ${mockToken}`)
				.expect(200);
			await requestHook()
				.set('Authorization', `Bearer ${mockToken}`)
				.expect(200);
		});

		it('should deflect if missing headers', async () => {
			await requestHook().expect(400);
		});

		it('should deflect if header value is not a Bearer Token', async () => {
			await requestHook().set('Authorization', mockToken).expect(400);
		});

		it('should deflect if missing token', async () => {
			await requestHook().set('Authorization', 'Bearer ').expect(400);
		});

		it('should deflect if token is invalid', async () => {
			await requestHook()
				.set('Authorization', 'Bearer my-fake-token')
				.expect(401);
		});

		it('should permit the request upon valid JWT', async () => {
			await requestHook()
				.set('Authorization', `Bearer ${mockToken}`)
				.expect(200);
		});
	});
});
