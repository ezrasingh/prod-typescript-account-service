import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';
import * as classValidator from 'class-validator';

import { app } from '../../../index';
import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';

describe('User Create API', () => {
	describe('POST /api/user', async () => {
		let sandbox: SinonSandbox;
		let mockAdmin: User;
		let payload: { email: string; password: string; role: UserRole };
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
			payload = {
				email: 'user@app.com',
				password: 'user2PASS123',
				role: UserRole.CUSTOMER
			};

			sandbox = createSandbox();

			tokenHook = (user: User) => {
				return generateToken(user, app.server.locals.jwtSecret);
			};

			requestHook = (token?: string) => {
				return request(app.server)
					.post('/api/user')
					.set('Authorization', `Bearer ${token}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if client is not an admin', async () => {
			const anonUser = new User();
			anonUser.email = 'anon@app.com';
			anonUser.password = 'anonPASS123';
			anonUser.role = UserRole.CUSTOMER;
			anonUser.hashPassword();

			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(anonUser) } as any);

			const userToken = tokenHook(anonUser);

			await requestHook(userToken).send(payload).expect(401);
		});

		it('should deflect if missing request body', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any);

			const adminToken = tokenHook(mockAdmin);
			await requestHook(adminToken).expect(400);
		});

		it('should deflect if user fails validation', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any);

			sandbox.replace(classValidator, 'validate', fake.resolves([, ,]));

			const adminToken = tokenHook(mockAdmin);
			await requestHook(adminToken).send(payload).expect(400);
		});

		it('should deflect if user already exist', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called during handler
				.returns({ findOneOrFail: fake.throws('user already exist') } as any);

			const adminToken = tokenHook(mockAdmin);
			await requestHook(adminToken).send(payload).expect(409);
		});

		it('should create a new user', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.onFirstCall() // ? called by checkRole
				.returns({ findOneOrFail: fake.resolves(mockAdmin) } as any)
				.onSecondCall() // ? called during handler
				.returns({ save: fake() } as any);

			const adminToken = tokenHook(mockAdmin);
			await requestHook(adminToken).send(payload).expect(201);
		});
	});
});
