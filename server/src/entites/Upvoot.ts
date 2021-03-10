import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

//many to many
//users -> upvoot <- posts
@ObjectType()
@Entity()
export class Upvoot extends BaseEntity {
	@Field()
	@Column({ type: "int" })
	value: number;

	@Field()
	@PrimaryColumn()
	userId: number;

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.upvoots)
	user: User;

	@Field()
	@PrimaryColumn()
	postId: number;

	@Field(() => Post)
	@ManyToOne(() => Post, (post) => post.upvoots, {
		onDelete: "CASCADE",
	})
	post: Post;
}
