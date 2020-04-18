import * as chai from 'chai';
import 'mocha';

import { User, UserRole } from '../../models/User';

describe('User model', () => {
	let user: User;

	beforeEach(() => {
		user = new User();
		user.id = 1;
		user.email = 'user@app.com';
		user.password = 'password';
		user.role = UserRole.CUSTOMER;
		user.createdAt = new Date();
		user.updatedAt = new Date();
	});

	it('should keep track of entity creation', () => {
		chai.expect(user.createdAt).to.be.an.instanceOf(Date);
		chai.expect(user.updatedAt).to.be.an.instanceOf(Date);
	});

	it("should be able to hash user's password", () => {
		const plainTextPassword = user.password;
		user.hashPassword();
		chai.expect(user.password).to.not.be.eql(plainTextPassword);
	});

	it("should be able to verify user's password", () => {
		const plainTextPassword = user.password;
		user.hashPassword();
		chai.expect(user.verifyPassword('letmein')).to.be.false;
		chai.expect(user.verifyPassword(user.password)).to.be.false;
		chai.expect(user.verifyPassword(plainTextPassword)).to.be.true;
	});
});
