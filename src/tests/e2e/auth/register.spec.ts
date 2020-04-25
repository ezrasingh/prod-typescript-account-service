import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';

import 'mocha';

import * as typeorm from 'typeorm';
import * as classValidator from 'class-validator';
import { app } from '../../../index';
import { passwordValidator } from '../../../controllers/AuthController';

describe('Accounts Registration API', () => {
	describe('POST /api/auth/register', async () => {
		let sandbox: SinonSandbox;
		let payload: {
			email: string;
			password: string;
			confirmPassword: string;
			profile: { firstName: string; lastName: string };
		};
		let requestHook: Function;

		beforeEach(() => {
			payload = {
				email: 'user@app.com',
				password: 'userPASS123',
				confirmPassword: 'userPASS123',
				profile: {
					firstName: 'John',
					lastName: 'Doe',
				},
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
			const res = await requestHook().expect(400);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if password does not meet validation', async () => {
			sandbox
				.stub(passwordValidator, 'checkPassword')
				.returns({ isValid: false, validationMessage: 'error' });

			const res = await requestHook().send(payload).expect(401);

			chai.expect(res.body.message).to.be.an('string');
		});

		it('should deflect if password confirmation is invalid', async () => {
			payload.confirmPassword = 'wrongpass';

			sandbox
				.stub(passwordValidator, 'checkPassword')
				.returns({ isValid: true });

			const res = await requestHook().send(payload).expect(400);

			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if user validation fails', async () => {
			sandbox
				.stub(passwordValidator, 'checkPassword')
				.returns({ isValid: true });

			sandbox.replace(classValidator, 'validate', fake.resolves([, ,]));

			const res = await requestHook().send(payload).expect(400);

			chai.expect(res.body.errors).to.be.an('array');
		});

		it('should deflect if account already exist', async () => {
			sandbox
				.stub(passwordValidator, 'checkPassword')
				.returns({ isValid: true });

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: fake.throws('user already exist') } as any);

			const res = await requestHook().send(payload).expect(409);

			chai.expect(res.body.message).to.be.a('string');
		});

		it('should register user account', async () => {
			sandbox
				.stub(passwordValidator, 'checkPassword')
				.returns({ isValid: true });

			sandbox.stub(typeorm, 'getRepository').returns({ save: fake() } as any);

			const res = await requestHook().send(payload).expect(201);
			chai.expect(res.body.message).to.be.a('string');
		});
	});
});
