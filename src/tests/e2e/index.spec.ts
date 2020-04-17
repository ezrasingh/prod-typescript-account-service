import * as chai from 'chai';
import * as assert from 'assert';
import * as request from 'supertest';
import 'mocha';

import { app } from '../../index';

describe('Accounts service', () => {
	let requestHook: Function;

	beforeEach(() => {
		requestHook = () => request(app.server).get('/health');
	});

	describe('GET /health', () => {
		it('should return service health check', async () => {
			const res = await requestHook().expect(200);

			assert.deepEqual(res.body.status, 'UP');
			assert.deepEqual(res.body.environment, 'testing');
			chai.expect(res.body.uptime).to.be.a('number');
		});
	});
});
