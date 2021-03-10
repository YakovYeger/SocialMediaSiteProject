import { Field, ObjectType, Int } from "type-graphql";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Upvoot } from "./Upvoot";
import { User } from "./User";
@ObjectType()
@Entity()
export class Post extends BaseEntity {
	@Field(() => Int)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column()
	creatorId: number;

	@Field()
	@Column()
	title!: string;

	@Field()
	@Column()
	text!: string;

	@Field()
	@Column({ type: "int", default: 0 })
	points!: number;

	@Field(() => Int, { nullable: true }) //only a graphql schema value so no @column
	voteStatus: number | null; // 1 or -1 or null

	@Field()
	@ManyToOne(() => User, (user) => user.posts)
	creator: User;

	@OneToMany(() => Upvoot, (upvoot) => upvoot.post)
	upvoots: Upvoot[];

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date;
}
