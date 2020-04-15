import { createSandbox, SinonSandbox, spy, fake } from 'sinon';
import * as assert from 'assert';
import * as chai from 'chai';
import * as request from 'supertest';
import * as classValidator from 'class-validator';
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../../index';
import { User, UserRole } from '../../../models/User';
import { generateToken } from '../../../utils';
import { passwordValidator } from '../../../controllers/AuthController';

describe('Accounts service Auth API', () => {
	describe('Change Password Endpoint', async () => {
		let sandbox: SinonSandbox;
		let token: string;
		let mockUser: User;
		let mockPayload: any;

		beforeEach(() => {
			mockUser = new User();
			mockUser.email = 'fake@user.com';
			mockUser.password = 'validPASS123';
			mockUser.role = UserRole.CUSTOMER;
			mockPayload = {
				oldPassword: mockUser.password,
				newPassword: 'new-validPASS123',
				confirmPassword: 'new-validPASS123'
			}
			mockUser.hashPassword();
			token = generateToken(mockUser, app.server.locals.jwtSecret);
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing JWT', async () => {
			await request(app.server)
				.post('/api/auth/change-password')
				.expect(400);
		})

		it('should deflect if missing body', async () => {
			await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.expect(400);
		});

		it('should deflect if new password fails validation', async () => {
			const mockValidationErrors = [ 'min', 'uppercase', 'digits' ];
			sandbox
				.stub(passwordValidator, 'validate')
				.value(fake.returns(mockValidationErrors));

			const res = await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send(mockPayload)
				.expect(401);

			assert.deepEqual(res.body.validationErrors, mockValidationErrors);
		});

		it('should deflect if new password fails confirmation', async () => {
			mockPayload.confirmPassword = 'notmypass';

			await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send(mockPayload)
				.expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.throws(new Error('user does not exist')) } as any);

			await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send(mockPayload)
				.expect(401);
		});

		it('should deflect if old password fails verification', async () => {
			mockPayload.oldPassword = 'wrongpass';

			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send(mockPayload)
				.expect(401);
		});

		it('should deflect if user validation fails', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			sandbox
				.stub(classValidator, 'validate')
				.value(fake.resolves([ 'error_1', 'error_2' ]));

			await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send(mockPayload)
				.expect(400);
		});

		it('should update user\'s password', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({
					findOneOrFail: fake.resolves(mockUser),
					save: fake()
				} as any);

			await request(app.server)
				.post('/api/auth/change-password')
				.set('Authorization', `Bearer ${token}`)
				.send(mockPayload)
				.expect(204);
			});
	});
});
