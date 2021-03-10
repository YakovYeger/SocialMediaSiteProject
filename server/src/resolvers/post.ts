import { Post } from "../entites/Post";
import {
	Resolver,
	Query,
	Int,
	Arg,
	Mutation,
	InputType,
	Field,
	Ctx,
	UseMiddleware,
	FieldResolver,
	Root,
	ObjectType,
} from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Upvoot } from "../entites/Upvoot";
import { User } from "../entites/User";

@InputType()
class PostInput {
	@Field()
	title!: string;

	@Field()
	text!: string;
}
@ObjectType()
class PaginatedPosts {
	@Field(() => [Post])
	posts: Post[];
	@Field(() => Boolean)
	hasMore: boolean;
}
@Resolver(Post)
export class PostResolver {
	//create this field so we dont need to load entire text for every post
	@FieldResolver(() => String)
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 50); //first fifty characters of each post
	}
	//for every post this query runs-- need dataLoader to enhance efficiency
	@FieldResolver(() => User)
	creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
		return userLoader.load(post.creatorId); //batches all  of the creatorIds being queried
		// so a single sql command is called for alkl of the posts
		//User.findOne(post.creatorId); //find the creator of the post
	}

	@FieldResolver(() => Int, { nullable: true })
	async voteStatus(
		@Root() post: Post,
		@Ctx() { upvootLoader, req }: MyContext
	) {
		if (!req.session.userId) {
			return null;
		}
		const upvoot = await upvootLoader.load({
			postId: post.id,
			userId: req.session.userId,
		});
		return upvoot ? upvoot.value : null;
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth) //can only vote if you are logged in
	async vote(
		@Arg("postId", () => Int) postId: number,
		@Arg("value", () => Int) value: number,
		@Ctx() { req }: MyContext
	) {
		const isUpvoot = value !== -1;
		const realValue = isUpvoot ? 1 : -1;
		const { userId } = req.session;
		const upvoot = await Upvoot.findOne({ where: { postId, userId } });

		//user has cast vote on this post before
		//and they are changing their vote
		if (upvoot && upvoot.value !== realValue) {
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
			update upvoot
			set value = $1
			where "postId" = $2 and "userId" = $3
			`,
					[realValue, postId, userId]
				);
			});
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
					update post 
					set points = points + $1
					where id = $2;
			`,
					[2 * realValue, postId] //multiply by two as a 1 vote should become a -1
				);
			});
		} else if (!upvoot) {
			//hasn't voted before
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
			insert into upvoot ("userId", "postId", value)
			values ($1, $2, $3);
			`,
					[userId, postId, realValue]
				);
				await tm.query(
					`
				update post 
				set points = points + $1
				where id = $2;
		
				`,
					[realValue, postId]
				);
			});
		}

		return true;
	}

	@Query(() => PaginatedPosts)
	async posts(
		@Arg("limit", () => Int) limit: number,
		@Arg("cursor", () => String, { nullable: true }) cursor: string | null //is a string unless its the first fetch which will return null
	): Promise<PaginatedPosts> {
		const realLimit = Math.min(50, limit);
		const realLimitPlusOne = realLimit + 1; //fetch extra post to know if we reached the end
		const replacements: any[] = [realLimitPlusOne];

		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}
		//create custom query to get creators of posts along with the post
		//downsides: sometimes does extra work even when we dont need creator
		//lots of duplicate queries (single post, upvoots etc.)
		const posts = await getConnection().query(
			`
			select p.*
			from post p
			${cursor ? `where p."createdAt" < $2` : ""}
			order by p."createdAt" DESC
			limit $1
			`,
			replacements
		);
		return {
			posts: posts.slice(0, realLimit),
			hasMore: posts.length === realLimitPlusOne,
		};
	}

	@Query(() => Post, { nullable: true })
	post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(
		@Arg("input") input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		return Post.create({
			...input,
			creatorId: req.session.userId,
		}).save();
	}

	@Mutation(() => Post, { nullable: true })
	@UseMiddleware(isAuth)
	async updatePost(
		@Arg("id", () => Int) id: number,
		@Arg("title") title: string,
		@Arg("text") text: string,
		@Ctx() { req }: MyContext
	): Promise<Post | null> {
		//update post with id: id and update the title
		const result = await getConnection()
			.createQueryBuilder()
			.update(Post)
			.set({ title, text })
			.where('id = :id and "creatorId" = creatorId', {
				id,
				creatorId: req.session.userId,
			})
			.returning("*")
			.execute();
		return result.raw[0];
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async deletePost(
		@Arg("id", () => Int) id: number,
		@Ctx() { req }: MyContext
	): Promise<Boolean> {
		// //standard without cascading
		// const post = await Post.findOne(id);
		// if (!post) {
		// 	return false;
		// }
		// if (post.creatorId !== req.session.userId) {
		// 	throw new Error("not authorised");
		// }
		// await Upvoot.delete({ postId: id });
		// await Post.delete({ id }); //only delete post you own

		await Post.delete({ id, creatorId: req.session.userId });
		return true;
	}
}
