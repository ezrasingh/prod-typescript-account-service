import { createSandbox, SinonSandbox, spy } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';
import * as chai from 'chai';
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../index';
import { User } from '../../models/User';

const expect = chai.expect;

describe('Accounts service Auth API', () => {
	describe('Login Endpoint', async () => {
		let sandbox: SinonSandbox;
		let userCredentials: any;
		let mockUser: User;

		beforeEach(() => {
			mockUser = new User();
			mockUser.email = 'fake@user.com';
			mockUser.password = 'letmein';
			mockUser.hashPassword();
			userCredentials = { email: 'fake@user.com', password: 'letmein' };
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			await request(app.server).post('/api/auth/login').expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: async () => {
					throw new Error();
				}
			} as any);
			await request(app.server)
				.post('/api/auth/login')
				.send(userCredentials)
				.expect(401);
		});

		it('should deflect if user password is invalid', async () => {
			const spyOnFind = spy(async () => mockUser);
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: spyOnFind } as any);
			sandbox.stub(mockUser, 'verifyPassword').returns(false);
			await request(app.server)
				.post('/api/auth/login')
				.send(userCredentials)
				.expect(401);
			assert.deepEqual(spyOnFind.callCount, 1);
		});

		it('should issue a signed jwt upon valid credentials', async () => {
			const spyOnFind = spy(async () => mockUser);
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: spyOnFind } as any);
			await request(app.server)
				.post('/api/auth/login')
				.send(userCredentials)
				.expect(200);
			assert.deepEqual(spyOnFind.callCount, 1);
		});
	});
});
