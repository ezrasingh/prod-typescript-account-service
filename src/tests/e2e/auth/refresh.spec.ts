import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';
import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';

describe('Accounts Refresh Token API', () => {
	describe('GET /api/auth/refresh', async () => {
		let sandbox: SinonSandbox;
		let token: string;
		let mockUser: User;
		let requestHook: Function;

		beforeEach(() => {
			mockUser = new User();
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.role = UserRole.CUSTOMER;

			token = generateToken(mockUser, app.server.locals.jwtSecret);
			sandbox = createSandbox();

			requestHook = (token?: string) => {
				return request(app.server)
					.get('/api/auth/refresh')
					.set('Authorization', `Bearer ${token}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if JWT is missing from the header', async () => {
			await requestHook().expect(401);
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.throws('user does not exist')
			} as any);

			await requestHook(token).expect(401);
		});

		it('should provide fresh JWT', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			const res = await requestHook(token).expect(200);

			chai.expect(res.body.token).to.be.a('string');
		});
	});
});
