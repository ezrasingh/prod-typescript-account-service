import app from '../index';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';

chai.use(chaiHttp);

describe('Auth API endpoint', () => {
	it('should pass healthcheck', async () => {
		const res = await chai.request(app).post('/health');
		chai.expect(res.status).to.eql(200);
		return res;
	});
});
