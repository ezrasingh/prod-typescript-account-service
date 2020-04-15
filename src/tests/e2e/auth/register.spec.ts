import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';
import { passwordValidator } from '../../../controllers/AuthController';

describe('Accounts service Auth API', () => {
	describe('Register Endpoint', async () => {
		let sandbox: SinonSandbox;
		let userCredentials: any = {};

		beforeEach(() => {
			userCredentials = {
				email: 'fake@user.com',
				password: 'validPASS123',
				confirmPassword: 'validPASS123'
			};
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			await request(app.server).post('/api/auth/register').expect(400);
		});

		it('should deflect if password does not meet validation', async () => {
			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.returns([ 'min', 'uppercase', 'digits' ]));

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(401);
		});

		it('should deflect if password confirmation is invalid', async () => {
			userCredentials.confirmPassword = 'letmein';

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(400);
		});

		it('should deflect if user validation fails', async () => {
			userCredentials.email = 'fakeuser';

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(400);
		});

		it('should deflect if account already exist', async () => {
			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.resolves([]));

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: fake.throws(new Error('user already exist')) } as any);

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(409);
		});

		it('should register user account', async () => {
			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.resolves([]));

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: fake() } as any);

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(201);
		});
	});
});
