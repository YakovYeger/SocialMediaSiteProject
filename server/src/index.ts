import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
//import Post from "./entites/Post";
//setting up graphql using apollo server for querying db
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
//resolvers for graphql
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { userResolver } from "./resolvers/user";
//cookies- user stays logged in and can use app/webpage etc.
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entites/Post";
import { User } from "./entites/User";
import path from "path";
import { Upvoot } from "./entites/Upvoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpvootLoader } from "./utils/createUpvootLoader";

//rerun
const main = async () => {
	const conn = await createConnection({
		type: "postgres",
		database: "lireddit2",
		username: "postgres",
		password: "yeger",
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, "./migrations/*")],
		entities: [Post, User, Upvoot],
	});

	await conn.runMigrations();
	// await Post.delete({});
	const app = express();
	// clear users
	// await orm.em.nativeDelete(User, {});

	const RedisStore = connectRedis(session);
	const redis = new Redis();

	app.use(
		cors({
			origin: "http://localhost:3000",
			credentials: true,
		})
	);

	//settings for cookies using redis
	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //ten years
				httpOnly: true,
				secure: __prod__, //cookie only works in https
				sameSite: "lax", //csrf
			},
			saveUninitialized: false,
			secret: "sea;dknasdlkjasnf;an",
			resave: false,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, userResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({
			req,
			res,
			redis,
			userLoader: createUserLoader(),
			upvootLoader: createUpvootLoader(),
		}),
	});

	apolloServer.applyMiddleware({
		app,
		cors: false,
	});

	app.listen(4000, () => {
		console.log("Server started on localhost:4000");
	});

	//const post = orm.em.create(Post, { title: "my first post" });
	//   await orm.em.persistAndFlush(post);
	//   const posts= await orm.em.find(Post, {});
	//   console.log(posts);
};

main().catch((err) => {
	console.error(err);
});
