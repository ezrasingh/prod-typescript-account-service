import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	UpdateDateColumn,
	OneToOne
} from 'typeorm';
import { Length, IsNotEmpty } from 'class-validator';

import { User } from './User';

@Entity()
export class Profile {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	@IsNotEmpty()
	firstName: string;

	@Column()
	@IsNotEmpty()
	lastName: string;

	@Column()
	@Length(10, 25)
	phoneNumber: string;

	@OneToOne(_type => User, user => user.profile, { cascade: ["update"] })
	user: User;

	@Column()
	@UpdateDateColumn()
	updatedAt: Date;
}
