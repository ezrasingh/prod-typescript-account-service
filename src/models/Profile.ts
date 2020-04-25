import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Length, IsNotEmpty } from 'class-validator';

export class Name {
	@Column()
	@IsNotEmpty()
	first: string;

	@Column()
	@IsNotEmpty()
	last: string;
}

@Entity()
export class Profile {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column(_type => Name)
	name: Name;

	@Column({ nullable: true })
	@Length(10, 25)
	phoneNumber: string;
}
