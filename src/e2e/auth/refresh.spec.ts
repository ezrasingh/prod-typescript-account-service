import { createSandbox, SinonSandbox, spy } from 'sinon';
import * as assert from 'assert';
import * as chai from 'chai';
import * as request from 'supertest';
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../../index';
import { User, UserRole } from '../../models/User';
import { generateToken } from '../../utils';

describe('Accounts service Auth API', () => {
	describe('Refresh Endpoint', async () => {
		let sandbox: SinonSandbox;
		let token: string;
		let mockUser: User;

		beforeEach(() => {
			mockUser = new User();
			mockUser.email = 'fake@user.com';
			mockUser.password = 'letmein';
			mockUser.role = UserRole.CUSTOMER;
			token = generateToken(mockUser, app.server.locals.jwtSecret);
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if JWT is missing from the header', async () => {
			await request(app.server).get('/api/auth/refresh').expect(400);
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: async () => {
					throw new Error();
				}
			} as any);
			await request(app.server)
				.get('/api/auth/refresh')
				.set('Authorization', `Bearer ${token}`)
				.expect(401);
		});

		it('should provide fresh JWT', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: async () => mockUser } as any);
			await request(app.server)
				.get('/api/auth/refresh')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);
		});
	});
});
