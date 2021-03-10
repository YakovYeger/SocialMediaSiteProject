import { Field, InputType } from "type-graphql";

@InputType()
export class userNamePasswordInput {
	@Field()
	email: string;
	@Field()
	username: string;
	@Field()
	password: string;
}
