import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';
import { passwordValidator } from '../../../controllers/AuthController';

describe('Accounts Registration API', () => {
	describe('POST /api/auth/register', async () => {
		let sandbox: SinonSandbox;
		let userCredentials: any = {};
		let requestHook: Function;

		beforeEach(() => {
			userCredentials = {
				email: 'user@app.com',
				password: 'userPASS123',
				confirmPassword: 'userPASS123'
			};

			sandbox = createSandbox();

			requestHook = () => {
				return request(app.server).post('/api/auth/register');
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			await requestHook().expect(400);
		});

		it('should deflect if password does not meet validation', async () => {
			const mockValidationErrors = ['min', 'uppercase', 'digits'];

			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.returns(mockValidationErrors));

			const res = await requestHook().send(userCredentials).expect(401);

			assert.deepEqual(res.body.validationErrors, mockValidationErrors);
		});

		it('should deflect if password confirmation is invalid', async () => {
			userCredentials.confirmPassword = 'letmein';

			await requestHook().send(userCredentials).expect(400);
		});

		it('should deflect if user validation fails', async () => {
			userCredentials.email = 'fakeuser';

			await requestHook().send(userCredentials).expect(400);
		});

		it('should deflect if account already exist', async () => {
			sandbox.stub(passwordValidator, 'validate').value(fake.resolves([]));

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: fake.throws('user already exist') } as any);

			await requestHook().send(userCredentials).expect(409);
		});

		it('should register user account', async () => {
			sandbox.stub(passwordValidator, 'validate').value(fake.resolves([]));

			sandbox.stub(typeorm, 'getRepository').returns({ save: fake() } as any);

			await requestHook().send(userCredentials).expect(201);
		});
	});
});
