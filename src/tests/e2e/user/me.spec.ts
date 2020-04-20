import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';

import { app } from '../../../index';
import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';

describe('User Identity API', () => {
	describe('GET /api/user/me', async () => {
		let sandbox: SinonSandbox;
		let mockUser: User;
		let tokenHook: Function;
		let requestHook: Function;

		before(() => {
			mockUser = new User();
			mockUser.id = 123;
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.role = UserRole.CUSTOMER;
			mockUser.hashPassword();
		});

		beforeEach(() => {
			sandbox = createSandbox();

			tokenHook = (user: User) => {
				return generateToken(user, app.server.locals.jwtSecret);
			};

			requestHook = (token?: string) => {
				return request(app.server)
					.get(`/api/user/me`)
					.set('Authorization', `Bearer ${token}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing token in request', async () => {
			const res = await requestHook().expect(401);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if token is stale', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.throws('user does not exist') } as any);

			const token = tokenHook(mockUser);

			const res = await requestHook(token).expect(404);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should return user account', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			const token = tokenHook(mockUser);

			const res = await requestHook(token).expect(200);

			chai.expect(res.body.user.id).to.be.eql(mockUser.id);
			chai.expect(res.body.user.email).to.be.eql(mockUser.email);
			chai.expect(res.body.user.role).to.be.eql(mockUser.role);
		});
	});
});
