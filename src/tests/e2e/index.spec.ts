import * as assert from 'assert';
import * as request from 'supertest';
import 'mocha';

import app from '../../index';

describe('Accounts service application', () => {
	it('should pass health check', async () => {
		const res = await request(app.server).post('/health').expect(200);

		assert.deepEqual(res.body, {
			status: 'UP',
			environment: process.env.NODE_ENV
		});
	});
});
