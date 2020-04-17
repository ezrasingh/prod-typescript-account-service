import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';

import { app } from '../../../index';
import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';

describe('User Read All API', () => {
	describe('GET /api/user', async () => {
		let sandbox: SinonSandbox;
		let mockAdmin: User;
		let tokenHook: Function;
		let requestHook: Function;

		before(() => {
			mockAdmin = new User();
			mockAdmin.email = 'admin@app.com';
			mockAdmin.password = 'adminPASS123';
			mockAdmin.role = UserRole.ADMIN;
			mockAdmin.hashPassword();
		});

		beforeEach(() => {
			sandbox = createSandbox();

			tokenHook = (user: User) => {
				return generateToken(user, app.server.locals.jwtSecret);
			};

			requestHook = (token?: string) => {
				return request(app.server)
					.get(`/api/user`)
					.set('Authorization', `Bearer ${token}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if requester is not an admin', async () => {
			const anonUser = new User();
			anonUser.email = 'anon@app.com';
			anonUser.password = 'anonPASS123';
			anonUser.role = UserRole.CUSTOMER;
			anonUser.hashPassword();

			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(anonUser) } as any);

			const anonToken = tokenHook(anonUser);
			await requestHook(anonToken).expect(401);
		});

		it('should return all user accounts', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({
					find: fake.resolves([, ,])
				} as any);

			const adminToken = tokenHook(mockAdmin);
			const res = await requestHook(adminToken).expect(200);

			chai.expect(res.body.users).to.be.an('array');
		});
	});
});
