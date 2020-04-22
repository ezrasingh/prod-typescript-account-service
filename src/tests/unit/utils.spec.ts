import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import 'mocha';

import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as typeorm from 'typeorm';
import {
	generatePasswordSchema,
	getJwtCertificates,
	signToken,
	startServer
} from '../../utils';
import { User } from '../../models/User';
import { Application, Database } from '../../lib';

describe('Utilities library', () => {
	describe('generatePasswordSchema', () => {
		let sandbox: SinonSandbox;
		let schemaHook: Function;

		interface ShortCircuitConfig {
			PASSWORD_ENFORCE_UPPERCASE: string;
			PASSWORD_ENFORCE_LOWERCASE: string;
			PASSWORD_ENFORCE_NUMBERS: string;
			PASSWORD_ENFORCE_SYMBOLS: string;
		}

		beforeEach(() => {
			sandbox = createSandbox();

			schemaHook = (shortCircuit: ShortCircuitConfig) => {
				// ? stub environment variables with a short circuit value
				for (let [key, val] of Object.entries(shortCircuit)) {
					sandbox.stub(process.env, key).value(val);
				}
				return generatePasswordSchema();
			};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should enforce uppercase', () => {
			const schema = schemaHook({
				PASSWORD_ENFORCE_UPPERCASE: 'true',
				PASSWORD_ENFORCE_LOWERCASE: 'false',
				PASSWORD_ENFORCE_NUMBERS: 'false',
				PASSWORD_ENFORCE_SYMBOLS: 'false'
			});

			chai.expect(schema.checkPassword('TESTPASS').isValid).to.be.true;
			chai.expect(schema.checkPassword('testpass').isValid).to.be.false;
			chai.expect(schema.checkPassword('12345678').isValid).to.be.false;
			chai.expect(schema.checkPassword('!@#$%^&*').isValid).to.be.false;
		});

		it('should enforce lowercase', () => {
			const schema = schemaHook({
				PASSWORD_ENFORCE_UPPERCASE: 'false',
				PASSWORD_ENFORCE_LOWERCASE: 'true',
				PASSWORD_ENFORCE_NUMBERS: 'false',
				PASSWORD_ENFORCE_SYMBOLS: 'false'
			});

			chai.expect(schema.checkPassword('TESTPASS').isValid).to.be.false;
			chai.expect(schema.checkPassword('testpass').isValid).to.be.true;
			chai.expect(schema.checkPassword('12345678').isValid).to.be.false;
			chai.expect(schema.checkPassword('!@#$%^&*').isValid).to.be.false;
		});

		it('should enforce numbers', () => {
			const schema = schemaHook({
				PASSWORD_ENFORCE_UPPERCASE: 'false',
				PASSWORD_ENFORCE_LOWERCASE: 'false',
				PASSWORD_ENFORCE_NUMBERS: 'true',
				PASSWORD_ENFORCE_SYMBOLS: 'false'
			});

			chai.expect(schema.checkPassword('TESTPASS').isValid).to.be.false;
			chai.expect(schema.checkPassword('testpass').isValid).to.be.false;
			chai.expect(schema.checkPassword('12345678').isValid).to.be.true;
			chai.expect(schema.checkPassword('!@#$%^&*').isValid).to.be.false;
		});

		it('should enforce symbols', () => {
			const schema = schemaHook({
				PASSWORD_ENFORCE_UPPERCASE: 'false',
				PASSWORD_ENFORCE_LOWERCASE: 'false',
				PASSWORD_ENFORCE_NUMBERS: 'false',
				PASSWORD_ENFORCE_SYMBOLS: 'true'
			});

			chai.expect(schema.checkPassword('TESTPASS').isValid).to.be.false;
			chai.expect(schema.checkPassword('testpass').isValid).to.be.false;
			chai.expect(schema.checkPassword('12345678').isValid).to.be.false;
			chai.expect(schema.checkPassword('!@#$%^&*').isValid).to.be.true;
		});
	});

	describe('signToken', () => {
		let publicKey: string;
		let user: User;

		before(() => {
			const { cert } = getJwtCertificates();
			publicKey = cert;
		});

		beforeEach(() => {
			user = new User();
			user.id = 1;
			user.email = 'user@app.com';
		});
		it('should return signed JWT', () => {
			const token = signToken(user);
			const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
			chai.expect(payload['userId']).to.be.eql(user.id);
		});
		it('should fail if signature is self signed', () => {});
	});

	describe('startServer', () => {
		let sandbox: SinonSandbox;
		let mockApp: Application;
		let mockDb: Database;

		beforeEach(() => {
			sandbox = createSandbox();
			sandbox.replace(typeorm, 'getConnectionManager', fake());
			sandbox.replace(console, 'log', fake());

			mockDb = new Database(1, 1, 'db://', []);
			mockApp = new Application(1);
		});

		afterEach(() => {
			sandbox.restore();
		});
		it('should attempt to connect to the database', async () => {
			const dbConnectSpy = fake();
			sandbox.replace(mockDb, 'connect', dbConnectSpy);

			await startServer(mockApp, mockDb);

			chai.expect(dbConnectSpy.calledOnce).to.be.true;
		});

		it('should fail if connection to database fails', async () => {
			sandbox.replace(
				mockDb,
				'connect',
				fake.throws('could not establish connection')
			);

			try {
				await startServer(mockApp, mockDb);
			} catch (error) {
				chai.expect(error).to.be.an.instanceOf(Error);
			}
		});

		it('should fail if application runtime fails', async () => {
			sandbox.replace(mockDb, 'connect', fake());
			sandbox.replace(mockApp, 'start', fake.throws('app runtime failed'));

			try {
				await startServer(mockApp, mockDb);
			} catch (error) {
				chai.expect(error).to.be.an.instanceOf(Error);
			}
		});

		it('should initialize resources and begin runtime', async () => {
			sandbox.replace(mockDb, 'connect', fake());
			sandbox.replace(mockApp, 'start', fake());

			await startServer(mockApp, mockDb);
		});
	});
});
