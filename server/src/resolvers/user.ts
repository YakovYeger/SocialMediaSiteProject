import { User } from "../entites/User";
import { MyContext } from "src/types";
import {
	Resolver,
	Field,
	Arg,
	Ctx,
	Mutation,
	ObjectType,
	Query,
	FieldResolver,
	Root,
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { userNamePasswordInput } from "./userNamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

@ObjectType()
class FieldError {
	@Field()
	field: string;
	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver(User)
export class userResolver {
	@FieldResolver(() => String)
	//field level resolver to ensure no one accesses field they shouldn't (can be applied anywhere)
	email(@Root() user: User, @Ctx() { req }: MyContext) {
		//current user is owner of post and can show them their own email
		if (req.session.userId === user.id) {
			return user.email;
		}
		//current user wishes to see email of post creator
		return "";
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg("token") token: string,
		@Arg("newPassword") newPassword: string,
		@Ctx() { redis, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 4) {
			return {
				errors: [
					{
						field: "newPassword",
						message: "password must be longer than four characters",
					},
				],
			};
		}
		const key = FORGET_PASSWORD_PREFIX + token;
		const userId = await redis.get(key);

		//assume user didnt mess with token
		if (!userId) {
			return {
				errors: [
					{
						field: "token",
						message: "token expired",
					},
				],
			};
		}
		const userIdNum = parseInt(userId);
		const user = await User.findOne(userIdNum);

		if (!user) {
			return {
				errors: [
					{
						field: "token",
						message: "user no longer exists",
					},
				],
			};
		}
		await User.update(
			{ id: userIdNum },
			{ password: await argon2.hash(newPassword) }
		);

		await redis.del(key);

		//login user after change password
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg("email") email: string,
		@Ctx() { redis }: MyContext
	) {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			//email is not in db
			return true;
		}

		const token = v4();
		await redis.set(
			FORGET_PASSWORD_PREFIX + token,
			user.id,
			"ex",
			1000 * 60 * 60 * 24 * 3
		);
		await sendEmail(
			email,
			`<a href="http://localhost:3000/change-password/${token}">reset password</a>`
		);
		return true;
	}

	@Query(() => User, { nullable: true })
	async me(@Ctx() { req }: MyContext) {
		//console.log("session: ", req.session);
		//you are not logged in
		if (!req.session.userId) {
			return null;
		}
		const user = await User.findOne(req.session.userId);
		return user;
	}

	//register new user
	@Mutation(() => UserResponse)
	async register(
		@Arg("options", () => userNamePasswordInput)
		options: userNamePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		//validation function in seperate file
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}
		const hashedPassword = await argon2.hash(options.password);
		let user;
		try {
			//User.create({}) equivalent code
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					email: options.email,
					username: options.username,
					password: hashedPassword,
				})
				.returning("*")
				.execute();
			user = result.raw[0];
		} catch (err) {
			console.log("err: ", err);
			//duplicate user error
			if (
				err.code === "23505" ||
				err.detail.includes("already  exists")
			) {
				//
				return {
					errors: [
						{
							field: "username",
							message: "username already taken",
						},
					],
				};
			}
		}

		//store user id session, give them a cookie and keep them logged in
		req.session.userId = user.id;
		return { user };
	}

	//login for registered user
	@Mutation(() => UserResponse)
	async login(
		@Arg("usernameOrEmail") usernameOrEmail: string,
		@Arg("password") password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const user = await User.findOne(
			usernameOrEmail.includes("@")
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		);

		if (!user) {
			return {
				errors: [
					{
						field: "usernameOrEmail",
						message: "That username or email doesn't exist",
					},
				],
			};
		}
		const valid = await argon2.verify(user.password, password);

		if (!valid) {
			return {
				errors: [
					{
						field: "password",
						message: "Incorrect Password",
					},
				],
			};
		}

		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		return new Promise((resolve) =>
			req.session.destroy((err: any) => {
				res.clearCookie(COOKIE_NAME);
				if (err) {
					console.log(err);
					resolve(false);
					return;
				}
				resolve(true);
			})
		);
	}
}
