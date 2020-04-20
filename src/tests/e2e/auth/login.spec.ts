import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as request from 'supertest';
import 'mocha';

import * as typeorm from 'typeorm';
import { app } from '../../../index';
import { User } from '../../../models/User';

describe('Accounts Login API', () => {
	describe('POST /api/auth/login', async () => {
		let sandbox: SinonSandbox;
		let mockUser: User;
		let payload: { email: string; password: string };
		let requestHook: Function;

		before(() => {
			mockUser = new User();
			mockUser.email = 'user@app.com';
			mockUser.password = 'userPASS123';
			mockUser.hashPassword();
		});

		beforeEach(() => {
			payload = { email: 'user@app.com', password: 'userPASS123' };

			sandbox = createSandbox();

			requestHook = () => {
				return request(app.server).post('/api/auth/login');
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			const res = await requestHook().expect(400);

			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if user does not exist', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.throws('user does not exist')
			} as any);

			const res = await requestHook().send(payload).expect(401);

			chai.expect(res.body.message).to.be.a('string');
		});

		it('should deflect if user password is invalid', async () => {
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: fake.resolves(mockUser) } as any);

			sandbox.stub(mockUser, 'verifyPassword').value(fake.returns(false));

			const res = await requestHook().send(payload).expect(401);
			chai.expect(res.body.message).to.be.a('string');
		});

		it('should issue a signed jwt upon valid credentials', async () => {
			sandbox.stub(typeorm, 'getRepository').returns({
				findOneOrFail: fake.resolves(mockUser),
				save: fake()
			} as any);

			const res = await requestHook().send(payload).expect(200);

			chai.expect(res.body.token).to.be.a('string');
		});
	});
});
