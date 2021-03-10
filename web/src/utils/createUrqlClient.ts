import {
	dedupExchange,
	fetchExchange,
	Exchange,
	stringifyVariables,
	gql,
} from "urql";
import { Cache, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { pipe, tap } from "wonka";
import {
	LogoutMutation,
	MeQuery,
	MeDocument,
	LoginMutation,
	RegisterMutation,
	VoteMutationVariables,
	DeletePostMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import Router from "next/router";
import { isServer } from "./isServer";
const errorExchange: Exchange = ({ forward }) => (ops$) => {
	return pipe(
		forward(ops$),
		tap(({ error }) => {
			if (error?.message.includes("not authenticated")) {
				//use replace to redirect
				Router.replace("/login");
			}
		})
	);
};

const cursorPagination = (): Resolver => {
	return (_parent, fieldArgs, cache, info) => {
		const { parentKey: entityKey, fieldName } = info;

		const allFields = cache.inspectFields(entityKey);
		const fieldInfos = allFields.filter(
			(info) => info.fieldName === fieldName
		);
		const size = fieldInfos.length;
		if (size === 0) {
			return undefined;
		}
		//read data from cache and return it

		const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
		const isItInTheCache = cache.resolve(
			cache.resolve(entityKey, fieldKey) as string,
			"posts"
		);
		info.partial = !isItInTheCache;
		const results: string[] = [];
		let hasMore = true;
		fieldInfos.forEach((fi) => {
			const key = cache.resolve(entityKey, fi.fieldKey) as string;
			const data = cache.resolve(key, "posts") as string[];
			const _hasMore = cache.resolve(key, "hasMore");
			if (!_hasMore) {
				hasMore = _hasMore as boolean;
			}
			results.push(...data);
		});
		return {
			__typename: "PaginatedPosts",
			hasMore,
			posts: results,
		};
	};
};
const invalidateAllPosts = (cache: Cache) => {
	const allFields = cache.inspectFields("Query");
	const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
	fieldInfos.forEach((fi) => {
		cache.invalidate("Query", "posts", fi.arguments || {});
	});
};
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
	let cookie = "";
	if (isServer()) {
		cookie = ctx?.req?.headers?.cookie;
	}
	return {
		url: "http://localhost:4000/graphql",
		//will help with cookie sending
		//send cookie on ssr as well as csr
		fetchOptions: {
			credentials: "include" as const,
			headers: cookie ? { cookie } : undefined,
		},
		exchanges: [
			dedupExchange,
			//fix the bug where if user logs in the cache doesnt update and display the correct login/register peice on site
			cacheExchange({
				keys: {
					PaginatedPosts: () => null,
				},
				resolvers: {
					Query: {
						posts: cursorPagination(),
					},
				},
				updates: {
					Mutation: {
						deletePost: (_result, args, cache, info) => {
							cache.invalidate({
								__typename: "Post",
								id: (args as DeletePostMutationVariables).id,
							});
						},
						vote: (_result, args, cache, info) => {
							const {
								postId,
								value,
							} = args as VoteMutationVariables;
							const data = cache.readFragment(
								gql`
									fragment _ on Post {
										id
										points
										voteStatus
									}
								`,
								{ id: postId } as any
							);
							if (data) {
								if (data.voteStatus === value) {
									return;
								}
								const newPoints =
									data.points +
									(!data.voteStatus ? 1 : 2) * value; //if we voted we need to swap the value so multiply by 2
								cache.writeFragment(
									gql`
										fragment _ on Post {
											points
											voteStatus
										}
									`,
									{
										id: postId,
										points: newPoints,
										voteStatus: value,
									} as any
								);
							}
						},
						//invalidate query to generate new query updating the cache
						createPost: (_result, args, cache, info) => {
							invalidateAllPosts(cache);
						},
						logout: (_result, args, cache, info) => {
							betterUpdateQuery<LogoutMutation, MeQuery>(
								cache,
								{ query: MeDocument },
								_result,
								() => ({ me: null })
							);
						},
						login: (_result, args, cache, info) => {
							betterUpdateQuery<LoginMutation, MeQuery>(
								cache,
								{ query: MeDocument },
								_result,
								(result, query) => {
									if (result.login.errors) {
										return query;
									} else {
										return {
											me: result.login.user,
										};
									}
								}
							);
							invalidateAllPosts(cache);
						},

						register: (_result, args, cache, info) => {
							betterUpdateQuery<RegisterMutation, MeQuery>(
								cache,
								{ query: MeDocument },
								_result,
								(result, query) => {
									if (result.register.errors) {
										return query;
									} else {
										return {
											me: result.register.user,
										};
									}
								}
							);
						},
					},
				},
			}),
			errorExchange,
			ssrExchange,
			fetchExchange,
		],
	};
};
