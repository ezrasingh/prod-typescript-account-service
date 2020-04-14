import { createSandbox, SinonSandbox, spy } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';
import * as chai from 'chai';

import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../index';

describe('Accounts service Auth API', () => {
	describe('Register Endpoint', async () => {
		let sandbox: SinonSandbox;
		let userCredentials: any = {};
		beforeEach(() => {
			userCredentials = {
				email: 'fake@user.com',
				password: 'letmein',
				confirmPassword: 'letmein'
			};
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			await request(app.server).post('/api/auth/register').expect(400);
		});

		it('should deflect if password confirmation is invalid', async () => {
			userCredentials.confirmPassword = 'wrongpass';
			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(400);
		});

		it('should deflect if validation fails', async () => {
			userCredentials.email = 'fakeuser';
			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(400);
		});

		it('should deflect if account already exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				save: async () => {
					throw new Error();
				}
			} as any);
			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(409);
		});

		it('should register user account', async () => {
			const spyOnSave = spy(async () => {});
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: spyOnSave } as any);
			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(201);
			assert.deepEqual(spyOnSave.callCount, 1);
		});
	});
});
