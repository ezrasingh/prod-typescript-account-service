import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Unique,
	CreateDateColumn,
	UpdateDateColumn
} from "typeorm";
import { Length, IsEmail, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";

export enum UserRole {
	ADMIN = "admin",
	CUSTOMER = "customer",
	STAFF = "staff",
	EDITOR = "editor"
}

@Entity()
@Unique(["email"])
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	@Length(4, 20)
	@IsEmail()
	email: string;

	@Column()
	@Length(4, 100)
	password: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.CUSTOMER
	})
	@IsNotEmpty()
	role: string;

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column()
	@UpdateDateColumn()
	updatedAt: Date;

	hashPassword(): void {
		this.password = bcrypt.hashSync(this.password, 8);
	}

	verifyPassword(rawPassword: string): boolean {
		return bcrypt.compareSync(rawPassword, this.password);
	}
};
