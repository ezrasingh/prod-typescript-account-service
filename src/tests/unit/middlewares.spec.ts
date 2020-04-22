import { SinonSandbox, createSandbox, fake, SinonStub, stub } from 'sinon';
import * as request from 'supertest';
import 'mocha';

import * as express from 'express';
import * as typeorm from 'typeorm';
import { checkJwt, checkRole } from '../../middlewares';
import { signToken, getJwtCertificates } from '../../utils';
import { User, UserRole } from '../../models/User';

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
			const { cert } = getJwtCertificates();
			mockApp.locals.publicKey = cert;
		});

		beforeEach(() => {
			const mockUser = new User();
			mockUser.id = 123;
			mockUser.email = 'user@app.com';
			mockToken = signToken(mockUser);

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

	describe('checkRole', () => {
		let requestHook: Function;
		let mockToken: string;
		let mockUser: User;
		let sandbox: SinonSandbox;

		before(() => {
			mockApp = express();
			testRouter = express.Router();
			const { cert } = getJwtCertificates();
			mockApp.locals.publicKey = cert;
		});

		beforeEach(() => {
			mockUser = new User();
			mockUser.id = 123;
			mockUser.email = 'editor@app.com';
			mockUser.role = UserRole.EDITOR;

			mockToken = signToken(mockUser);

			testRouter.get(
				'/test/checkRole/staff',
				[checkJwt, checkRole([UserRole.STAFF])],
				mockHandler
			);
			testRouter.get(
				'/test/checkRole/editor',
				[checkJwt, checkRole([UserRole.EDITOR])],
				mockHandler
			);
			mockApp.use(testRouter);

			sandbox = createSandbox();
			requestHook = (role: string) => {
				return request(mockApp)
					.get(`/test/checkRole/${role}`)
					.set('Authorization', `Bearer ${mockToken}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if token is stale', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.throws('user doest not exist') } as any);

			await requestHook('editor').expect(401);
		});

		it('should permit request if roles are included', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall()
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any)
				.onSecondCall()
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			await requestHook('staff').expect(401);
			await requestHook('editor').expect(200);
		});
	});
});
