import { createSandbox, SinonSandbox, fake } from 'sinon';
import * as chai from 'chai';
import 'mocha';

import {
	generatePasswordSchema,
	generateToken,
	startServer,
	shutdownServer
} from '../../utils';

describe('Utilites library', () => {
	describe('generatePasswordSchema', () => {
		let sandbox: SinonSandbox;
		let schemaHook: Function;
		let password: string;

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

	describe('generateToken', () => {});

	describe('startServer', () => {});

	describe('shutdownServer', () => {});
});
