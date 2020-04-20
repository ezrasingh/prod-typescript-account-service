import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as classValidator from 'class-validator';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';

import { app } from '../../../index';
import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';

describe('User Update API', () => {
	describe('PATCH /api/user/:id', async () => {
		let sandbox: SinonSandbox;
		let payload: { email: string; role: UserRole };
		let mockAdmin: User;
		let mockUser: User;
		let tokenHook: Function;
		let requestHook: Function;

		before(() => {
			mockAdmin = new User();
			mockAdmin.id = 1;
			mockAdmin.email = 'admin@app.com';
			mockAdmin.password = 'adminPASS123';
			mockAdmin.role = UserRole.ADMIN;
			mockAdmin.hashPassword();
		});

		beforeEach(() => {
			mockUser = new User();
			mockUser.id = 123;
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.role = UserRole.CUSTOMER;
			mockUser.hashPassword();

			payload = {
				email: mockUser.email,
				role: UserRole.CUSTOMER
			};

			sandbox = createSandbox();

			tokenHook = (user: User) => {
				return generateToken(user, app.server.locals.jwtSecret);
			};

			requestHook = (id?: number, token?: string) => {
				return request(app.server)
					.patch(`/api/user/${id}`)
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
			anonUser.role = UserRole.STAFF;
			anonUser.hashPassword();

			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(anonUser) } as any);

			const anonToken = tokenHook(anonUser);

			await requestHook(mockUser.id, anonToken).send(payload).expect(401);
		});

		it('should deflect if missing request body', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any);

			const adminToken = tokenHook(mockAdmin);

			await requestHook(mockUser.id, adminToken).expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({ findOneOrFail: fake.throws('user does not exist') } as any);

			const adminToken = tokenHook(mockAdmin);

			await requestHook(mockUser.id, adminToken).send(payload).expect(404);
		});

		it('should deflect if user fails validation', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			sandbox.replace(classValidator, 'validate', fake.resolves([, ,]));

			const adminToken = tokenHook(mockAdmin);

			const res = await requestHook(mockUser.id, adminToken)
				.send(payload)
				.expect(400);

			chai.expect(res.body.errors).to.be.an('array');
		});

		it('should deflect if email is already taken', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({
					findOneOrFail: fake.resolves(mockUser),
					save: fake.throws('email is already taken')
				} as any);

			sandbox.replace(classValidator, 'validate', fake.resolves([]));

			const adminToken = tokenHook(mockAdmin);

			await requestHook(mockUser.id, adminToken).send(payload).expect(409);
		});

		it('should create a new user', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called by handler
				.returns({
					findOneOrFail: fake.resolves(mockUser),
					save: fake()
				} as any);

			sandbox.replace(classValidator, 'validate', fake.resolves([]));

			const adminToken = tokenHook(mockAdmin);

			await requestHook(mockUser.id, adminToken).send(payload).expect(201);
		});
	});
});
