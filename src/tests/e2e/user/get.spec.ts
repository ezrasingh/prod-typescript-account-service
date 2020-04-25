import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';

import { app } from '../../../index';
import { User, UserRole } from '../../../models/User';
import { signToken } from '../../../utils';

describe('User Read API', () => {
	describe('GET /api/user/:id', async () => {
		let sandbox: SinonSandbox;
		let mockAdmin: User;
		let mockUser: User;
		let tokenHook: Function;
		let requestHook: Function;

		before(() => {
			mockAdmin = new User();
			mockAdmin.email = 'admin@app.com';
			mockAdmin.password = 'adminPASS123';
			mockAdmin.role = UserRole.ADMIN;
			mockAdmin.hashPassword();

			mockUser = new User();
			mockUser.id = 17;
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.role = UserRole.CUSTOMER;
			mockUser.hashPassword();
		});

		beforeEach(() => {
			sandbox = createSandbox();

			tokenHook = (user: User) => {
				return signToken(user);
			};

			requestHook = (id?: number, token?: string) => {
				return request(app.server)
					.get(`/api/user/${id}`)
					.set('Authorization', `Bearer ${token}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if requester is not an admin', async () => {
			const anonUser = mockUser;

			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(anonUser) } as any);

			const anonToken = tokenHook(anonUser);

			const res = await requestHook(1, anonToken).expect(401);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if user does not exist', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({ findOneOrFail: fake.throws('user does not exist') } as any);

			const adminToken = tokenHook(mockAdmin);

			const res = await requestHook(1, adminToken).expect(404);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should return user account', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({
					findOneOrFail: fake.resolves(mockUser),
				} as any);

			const adminToken = tokenHook(mockAdmin);

			const res = await requestHook(mockUser.id, adminToken).expect(200);

			chai.expect(res.body.user.id).to.be.eql(mockUser.id);
			chai.expect(res.body.user.email).to.be.eql(mockUser.email);
			chai.expect(res.body.user.role).to.be.eql(mockUser.role);
		});
	});
});
