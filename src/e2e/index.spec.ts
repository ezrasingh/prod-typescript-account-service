import app from '../index';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';

chai.use(chaiHttp);

describe('Accounts service application', () => {
	it('should pass health check', async () => {
		const req = await chai.request(app.server);
		const res = await req.post('/health');
		chai.expect(res.status).to.eql(200);
		chai.expect(res.body).to.eql({
			status: 'UP',
			environment: process.env.NODE_ENV
		});
		return res;
	});
});
