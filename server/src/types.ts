import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createUpvootLoader } from "./utils/createUpvootLoader";
import { createUserLoader } from "./utils/createUserLoader";

export type MyContext = {
	req: Request & { session: Express.Session };
	redis: Redis;
	res: Response;
	userLoader: ReturnType<typeof createUserLoader>;

	upvootLoader: ReturnType<typeof createUpvootLoader>;
};
