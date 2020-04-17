import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';
import * as classValidator from 'class-validator';
import 'mocha';

import * as typeorm from 'typeorm';
import { app } from '../../../index';

import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';
import { passwordValidator } from '../../../controllers/AuthController';
import { Test } from 'mocha';

describe('Accounts Change Password API', () => {
	describe('POST /api/auth/change-password', async () => {
		let sandbox: SinonSandbox;
		let mockUser: User;
		let payload: {
			oldPassword: string;
			newPassword: string;
			confirmPassword: string;
		};
		let tokenHook: Function;
		let requestHook: Function;

		before(() => {
			mockUser = new User();
			mockUser.email = 'user@app.com';
			mockUser.role = UserRole.CUSTOMER;
		});

		beforeEach(() => {
			mockUser.password = 'userPASS123';
			mockUser.hashPassword();

			payload = {
				oldPassword: 'userPASS123',
				newPassword: 'newPASS123',
				confirmPassword: 'newPASS123'
			};

			sandbox = createSandbox();

			tokenHook = (user?: User): string => {
				return generateToken(user, app.server.locals.jwtSecret);
			};

			requestHook = (token?: string) => {
				return request(app.server)
					.post('/api/auth/change-password')
					.set('Authorization', `Bearer ${token}`);
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing JWT', async () => {
			await requestHook().expect(401);
		});

		it('should deflect if missing body', async () => {
			const userToken = tokenHook(mockUser);
			await requestHook(userToken).expect(400);
		});

		it('should deflect if new password fails validation', async () => {
			const mockValidationErrors = ['min', 'uppercase', 'digits'];

			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.returns(mockValidationErrors));

			const userToken = tokenHook(mockUser);
			const res = await requestHook(userToken).send(payload).expect(401);

			assert.deepEqual(res.body.validationErrors, mockValidationErrors);
		});

		it('should deflect if new password fails confirmation', async () => {
			payload.confirmPassword = 'notmypass';
			const userToken = tokenHook(mockUser);
			await requestHook(userToken).send(payload).expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.throws('user does not exist')
			} as any);

			const userToken = tokenHook(mockUser);
			await requestHook(userToken).send(payload).expect(401);
		});

		it('should deflect if old password fails verification', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			sandbox.stub(mockUser, 'verifyPassword').value(fake.returns(false));

			const userToken = tokenHook(mockUser);
			await requestHook(userToken).send(payload).expect(401);
		});

		it('should deflect if user validation fails', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			sandbox.stub(classValidator, 'validate').value(fake.resolves([, ,]));

			const userToken = tokenHook(mockUser);
			await requestHook(userToken).send(payload).expect(400);
		});

		it("should update user's password", async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.resolves(mockUser),
				save: fake()
			} as any);

			const userToken = tokenHook(mockUser);
			await requestHook(userToken).send(payload).expect(204);
		});
	});
});
