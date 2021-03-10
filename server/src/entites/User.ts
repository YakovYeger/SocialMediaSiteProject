import { Field, ObjectType, Int } from "type-graphql";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
	OneToMany,
} from "typeorm";
import { Post } from "./Post";
import { Upvoot } from "./Upvoot";
@ObjectType()
@Entity()
export class User extends BaseEntity {
	@Field(() => Int)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column({ unique: true })
	username!: string;

	@Field()
	@Column({ unique: true })
	email!: string;

	@Column()
	password!: string;

	@OneToMany(() => Post, (post) => post.creator)
	posts: Post[];

	@OneToMany(() => Upvoot, (upvoot) => upvoot.user)
	upvoots: Upvoot[];

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date;
}
