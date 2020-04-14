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
	describe('Register Endpoint', async () => {
		let sandbox: SinonSandbox;

		beforeEach(() => {
			sandbox = createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should deflect if missing body', async () => {
			const res = await chai.request(app.server).post('/api/auth/register');
			expect(res.status).to.eql(400);
			return res;
		});

		it('should deflect if password confirmation is invalid', async () => {
			const body = { email: 'fake@user.com', password: 'letmein', confirmPassword: 'wrongpass' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/register')
				.send(body);
			expect(res.status).to.eql(400);
			return res;
		});

		it('should deflect if validation fails', async () => {
			const body = { email: 'fakeuser', password: 'letmein', confirmPassword: 'letmein' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/register')
				.send(body);
			expect(res.status).to.eql(400);
			return res;
		});

		it('should deflect if account already exist', async () => {
			const spyOnSave = spy(async (_user: User) => {
				throw new Error('user already exist');
			});
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: spyOnSave } as any);
			const body = { email: 'fake@user.com', password: 'letmein', confirmPassword: 'letmein' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/register')
				.send(body);
			expect(res.status).to.eql(409);
			return res;
		});

		it('should register user account', async () => {
			const spyOnSave = spy(async () => {});
			sandbox
				.stub(typeorm, 'getRepository')
				.returns({ save: spyOnSave } as any);
			const body = { email: 'fake@user.com', password: 'letmein', confirmPassword: 'letmein' };
			const res = await chai
				.request(app.server)
				.post('/api/auth/register')
				.send(body);
			assert.deepEqual(spyOnSave.callCount, 1);
			expect(res.status).to.eql(201);
			expect(res.status).to.be.string;
			return res;
		});
	});
});
