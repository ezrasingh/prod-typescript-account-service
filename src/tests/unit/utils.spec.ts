import { createSandbox, SinonSandbox, fake, spy } from 'sinon';
import * as chai from 'chai';
import 'mocha';

import * as jwt from 'jsonwebtoken';
import * as typeorm from 'typeorm';
import {
	generatePasswordSchema,
	generateToken,
	startServer,
	shutdownServer
} from '../../utils';
import { User } from '../../models/User';
import Database from '../../db';
import Application from '../../app';

describe('Utilities library', () => {
	describe('generatePasswordSchema', () => {
		let sandbox: SinonSandbox;
		let schemaHook: Function;

		interface ShortCircuitConfig {
			PASSWORD_MIN_LEN: number;
			PASSWORD_MAX_LEN: number;
			PASSWORD_HAS_UPPERCASE: boolean;
			PASSWORD_HAS_LOWERCASE: boolean;
			PASSWORD_HAS_DIGITS: boolean;
			PASSWORD_HAS_SPACES: boolean;
		}

		beforeEach(() => {
			sandbox = createSandbox();

			schemaHook = (shortCircuit: ShortCircuitConfig) => {
				// ? stub environment variables with a short circuit value
				for (let [key, val] of Object.entries(shortCircuit)) {
					sandbox.stub(process.env, key).value(val as string);
				}
				return generatePasswordSchema();
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should validate against minimum length', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '10',
				PASSWORD_MAX_LEN: '15',
				PASSWORD_HAS_LOWERCASE: 'true',
				PASSWORD_HAS_UPPERCASE: 'true',
				PASSWORD_HAS_DIGITS: 'false',
				PASSWORD_HAS_SPACES: 'false'
			});
			console.log(process.env.PASSWORD_HAS_SPACES);
			chai.expect(schema.validate('testPASS')).to.be.false;
			chai.expect(schema.validate('testPASSWORD')).to.be.true;
			chai.expect(schema.validate('testPASS123')).to.be.true;
		});

		it('should validate against maximum length', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '5',
				PASSWORD_MAX_LEN: '10',
				PASSWORD_HAS_LOWERCASE: 'true',
				PASSWORD_HAS_UPPERCASE: 'true',
				PASSWORD_HAS_DIGITS: 'false',
				PASSWORD_HAS_SPACES: 'false'
			});
			chai.expect(schema.validate('testPASSWORD')).to.be.false;
			chai.expect(schema.validate('testPASSWO')).to.be.true;
			chai.expect(schema.validate('testPASSW')).to.be.true;
		});

		it('should validate against uppercase', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '5',
				PASSWORD_MAX_LEN: '10',
				PASSWORD_HAS_UPPERCASE: 'true',
				PASSWORD_HAS_LOWERCASE: 'false',
				PASSWORD_HAS_DIGITS: 'false',
				PASSWORD_HAS_SPACES: 'false'
			});
			chai.expect(schema.validate('testpass')).to.be.false;
			chai.expect(schema.validate('TESTPASS')).to.be.true;
		});

		it('should validate against lowercase', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '5',
				PASSWORD_MAX_LEN: '10',
				PASSWORD_HAS_UPPERCASE: 'false',
				PASSWORD_HAS_LOWERCASE: 'true',
				PASSWORD_HAS_DIGITS: 'false',
				PASSWORD_HAS_SPACES: 'false'
			});
			chai.expect(schema.validate('testpass')).to.be.true;
			chai.expect(schema.validate('TESTPASS')).to.be.false;
		});

		it('should validate against having digits', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '5',
				PASSWORD_MAX_LEN: '20',
				PASSWORD_HAS_UPPERCASE: 'true',
				PASSWORD_HAS_LOWERCASE: 'false',
				PASSWORD_HAS_DIGITS: 'true',
				PASSWORD_HAS_SPACES: 'false'
			});
			chai.expect(schema.validate('testpassword')).to.be.false;
			chai.expect(schema.validate('TESTPASS123')).to.be.true;
		});

		it('should validate against not including spaces', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '5',
				PASSWORD_MAX_LEN: '10',
				PASSWORD_HAS_UPPERCASE: 'true',
				PASSWORD_HAS_LOWERCASE: 'false',
				PASSWORD_HAS_DIGITS: 'false',
				PASSWORD_HAS_SPACES: 'false'
			});
			chai.expect(schema.validate('test pass')).to.be.false;
			chai.expect(schema.validate('TESTPASS')).to.be.true;
		});

		it('should validate against including spaces', () => {
			const schema = schemaHook({
				PASSWORD_MIN_LEN: '5',
				PASSWORD_MAX_LEN: '10',
				PASSWORD_HAS_UPPERCASE: 'true',
				PASSWORD_HAS_LOWERCASE: 'false',
				PASSWORD_HAS_DIGITS: 'false',
				PASSWORD_HAS_SPACES: 'true'
			});
			chai.expect(schema.validate('testpass')).to.be.false;
			chai.expect(schema.validate('TEST PASS')).to.be.true;
		});
	});

	describe('generateToken', () => {
		const signature = 'mock-signature';
		let user: User;

		beforeEach(() => {
			user = new User();
			user.id = 1;
			user.email = 'user@app.com';
		});
		it('should return signed JWT', () => {
			const token = generateToken(user, signature);
			const payload = jwt.verify(token, signature);
			chai.expect(payload['userId']).to.be.eql(user.id);
			chai.expect(payload['email']).to.be.eql(user.email);
		});
		it('should fail if signature is self signed', () => {
			const token = generateToken(user, 'self-signed-signature');
			try {
				jwt.verify(token, signature);
			} catch (error) {
				chai.expect(error).is.an.instanceOf(jwt.JsonWebTokenError);
			}
		});
	});

	describe('startServer', () => {
		let sandbox: SinonSandbox;
		let mockApp: Application;
		let mockDb: Database;
		let runtimeSpy;

		beforeEach(() => {
			runtimeSpy = spy();
			sandbox = createSandbox();
			sandbox
				.stub(typeorm, 'getConnectionManager')
				.returns({ has: fake.returns(true) } as any);

			mockDb = new Database(1, 1);
			mockApp = new Application(1);
		});

		afterEach(() => {
			sandbox.restore();
		});
		it('should attempt to connect to the database', async () => {
			const establishConnectionsSpy = fake();
			const loadConnectionsSpy = fake();
			sandbox.replace(mockDb, 'establishConnections', establishConnectionsSpy);
			sandbox.replace(mockDb, 'loadConnections', loadConnectionsSpy);

			await startServer(mockApp, mockDb);

			chai.expect(establishConnectionsSpy.calledOnce).to.be.true;
			chai.expect(loadConnectionsSpy.calledOnce).to.be.true;
		});

		it('should fail if connection to database fails', async () => {
			sandbox.replace(
				mockDb,
				'establishConnections',
				fake.throws('could not establish connection')
			);
			sandbox.replace(
				mockDb,
				'loadConnections',
				fake.throws('could not load connection')
			);
			try {
				await startServer(mockApp, mockDb);
			} catch (error) {
				chai.expect(error).to.be.an.instanceOf(Error);
			}
		});

		it('should fail if application runtime fails', async () => {
			sandbox.replace(mockDb, 'establishConnections', fake());
			sandbox.replace(mockDb, 'loadConnections', fake());
			sandbox.replace(mockApp, 'start', fake.throws('app runtime failed'));

			try {
				await startServer(mockApp, mockDb);
			} catch (error) {
				chai.expect(error).to.be.an.instanceOf(Error);
			}
		});

		it('should initialize resources and begin runtime', async () => {
			sandbox.replace(mockDb, 'establishConnections', fake());
			sandbox.replace(mockDb, 'loadConnections', fake());
			sandbox.replace(mockApp, 'start', fake());

			await startServer(mockApp, mockDb);
		});
	});

	describe('shutdownServer', () => {});
});
