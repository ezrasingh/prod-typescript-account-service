import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';
import 'mocha';

import * as typeorm from 'typeorm';
import { app } from '../../../index';
import { User, UserRole } from '../../../models/User';
import { signToken } from '../../../utils';

describe('Accounts Refresh Token API', () => {
	describe('GET /api/auth/refresh', async () => {
		let sandbox: SinonSandbox;
		let mockUser: User;
		let tokenHook: Function;
		let requestHook: Function;

		before(() => {
			mockUser = new User();
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.role = UserRole.CUSTOMER;
		});

		beforeEach(() => {
			sandbox = createSandbox();

			tokenHook = (user: User) => {
				return signToken(user);
			};

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
			const res = await requestHook().expect(401);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.throws('user does not exist')
			} as any);

			const userToken = tokenHook(mockUser);
			const res = await requestHook(userToken).expect(401);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should provide fresh JWT', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			const userToken = tokenHook(mockUser);
			const res = await requestHook(userToken).expect(200);

			chai.expect(res.body.token).to.be.a('string');
		});
	});
});
