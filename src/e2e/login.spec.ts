import { createSandbox, SinonSandbox, spy } from 'sinon';
import * as assert from 'assert';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';

import * as typeorm from 'typeorm';
import app from '../index';
import { User } from '../models/User';

const expect = chai.expect;

chai.use(chaiHttp);

describe('Accounts service Auth API', () => {
	describe('Login Endpoint', async () => {
		let sandbox: SinonSandbox;

		beforeEach(() => {
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			const res = await chai.request(app.server).post('/api/auth/login');
			expect(res.status).to.eql(400);
			return res;
		});

		it('should deflect if user does not exist', async () => {
			const spyOnFind = spy(async () => {
				throw new Error('no user found');
			});
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: spyOnFind } as any);
			const body = { email: 'fake@user.com', password: 'letmein' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/login')
				.send(body);
			assert.deepEqual(spyOnFind.callCount, 1);
			expect(res.status).to.eql(401);
			return res;
		});

		it('should deflect if user password is invalid', async () => {
			const mockUser = new User();
			const spyOnFind = spy(async () => mockUser);
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: spyOnFind } as any);
			sandbox
				.stub(mockUser, 'verifyPassword')
				.returns(false);
			const body = { email: 'fake@user.com', password: 'letmein' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/login')
				.send(body);
			assert.deepEqual(spyOnFind.callCount, 1);
			expect(res.status).to.eql(401);
			return res;
		});

		it('should issue a signed jwt upon valid credentials', async () => {
			const mockUser = new User();
			mockUser.email = 'fake@user.com';
			mockUser.password = 'letmein';
			mockUser.hashPassword();
			const spyOnFind = spy(async () => mockUser);
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ findOneOrFail: spyOnFind } as any);
			const body = { email: 'fake@user.com', password: 'letmein' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/login')
				.send(body);
			assert.deepEqual(spyOnFind.callCount, 1);
			expect(res.status).to.eql(200);
			expect(res.status).to.be.string;
			return res;
		});
	});
});
