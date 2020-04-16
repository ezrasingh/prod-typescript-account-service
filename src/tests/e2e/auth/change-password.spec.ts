import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as assert from 'assert';
import * as request from 'supertest';
import * as classValidator from 'class-validator';
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';

import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';
import { passwordValidator } from '../../../controllers/AuthController';

describe('Accounts Change Password API', () => {
	describe('POST /api/auth/change-password', async () => {
		let sandbox: SinonSandbox;
		let token: string;
		let mockUser: User;
		let mockPayload: any;
		let requestHook: Function;

		beforeEach(() => {
			mockUser = new User();
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.role = UserRole.CUSTOMER;

			mockPayload = {
				oldPassword: mockUser.password,
				newPassword: 'new-userPASS123',
				confirmPassword: 'new-userPASS123'
			};

			mockUser.hashPassword();
			token = generateToken(mockUser, app.server.locals.jwtSecret);
			sandbox = createSandbox();

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
			await requestHook(token).expect(400);
		});

		it('should deflect if new password fails validation', async () => {
			const mockValidationErrors = ['min', 'uppercase', 'digits'];

			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.returns(mockValidationErrors));

			const res = await requestHook(token).send(mockPayload).expect(401);

			assert.deepEqual(res.body.validationErrors, mockValidationErrors);
		});

		it('should deflect if new password fails confirmation', async () => {
			mockPayload.confirmPassword = 'notmypass';
			await requestHook(token).send(mockPayload).expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.throws('user does not exist')
			} as any);

			await requestHook(token).send(mockPayload).expect(401);
		});

		it('should deflect if old password fails verification', async () => {
			mockPayload.oldPassword = 'wrongpass';

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			await requestHook(token).send(mockPayload).expect(401);
		});

		it('should deflect if user validation fails', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			sandbox
				.stub(classValidator, 'validate')
				.value(fake.resolves(['error', 'error']));

			await requestHook(token).send(mockPayload).expect(400);
		});

		it("should update user's password", async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.resolves(mockUser),
				save: fake()
			} as any);

			await requestHook(token).send(mockPayload).expect(204);
		});
	});
});
