import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as assert from 'assert';
import * as chai from 'chai';
import * as request from 'supertest';
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';
import { User } from '../../../models/User';

describe('Accounts Login API', () => {
	describe('POST /api/auth/login', async () => {
		let sandbox: SinonSandbox;
		let userCredentials: any;
		let mockUser: User;
		let requestHook: Function;

		beforeEach(() => {
			mockUser = new User();
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';

			userCredentials = { email: mockUser.email, password: mockUser.password };

			mockUser.hashPassword();
			sandbox = createSandbox();

			requestHook = () => {
				return request(app.server).post('/api/auth/login');
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			await requestHook().expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.throws('user does not exist')
			} as any);

			await requestHook().send(userCredentials).expect(401);
		});

		it('should deflect if user password is invalid', async () => {
			mockUser.password = 'wrongpass';

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			await requestHook().send(userCredentials).expect(401);
		});

		it('should issue a signed jwt upon valid credentials', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			const res = await requestHook().send(userCredentials).expect(200);

			chai.expect(res.body.token).to.be.a('string');
		});
	});
});
