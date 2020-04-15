import { createSandbox, SinonSandbox, spy } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';
import { User } from '../../../models/User';
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
				.value(() => [ 'min', 'uppercase', 'digits' ]);

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
			const spyOnValidate = spy(async (_password: string, _options: any) => []);
			sandbox
				.stub(passwordValidator, 'validate')
				.value(spyOnValidate);

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: async () => { throw new Error(); } } as any);

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(409);

			assert(spyOnValidate.calledOnce);
			assert(spyOnValidate.calledWith(userCredentials.password, { list: true }));
		});

		it('should register user account', async () => {
			const spyOnValidate = spy(async (_password: string, _options: any) => []);
			sandbox
				.stub(passwordValidator, 'validate')
				.value(spyOnValidate);

			const spyOnSave = spy(async () => {});
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: spyOnSave } as any);

			await request(app.server)
				.post('/api/auth/register')
				.send(userCredentials)
				.expect(201);

			assert(spyOnValidate.calledOnce);
			assert(spyOnValidate.calledWith(userCredentials.password, { list: true }));
			assert(spyOnSave.calledOnce);
		});
	});
});
