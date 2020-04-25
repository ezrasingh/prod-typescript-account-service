import { SinonSandbox, createSandbox, fake } from 'sinon';
import * as chai from 'chai';
import * as assert from 'assert';
import * as request from 'supertest';
import 'mocha';

import { app } from '../../index';
import * as os from 'os';

describe('Accounts service', () => {
	let requestHook: Function;
	let sandbox: SinonSandbox;

	beforeEach(() => {
		sandbox = createSandbox();
		requestHook = () => request(app.server).get('/health');
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('GET /health', () => {
		it('should return service health check', async () => {
			sandbox.replace(os, 'uptime', fake.returns(123));
			const res = await requestHook().expect(200);

			assert.deepEqual(res.body.status, 'UP');
			assert.deepEqual(res.body.environment, 'testing');
			chai.expect(res.body.app).to.be.a('string');
			chai.expect(res.body.version).to.be.a('string');
		});
	});
});
