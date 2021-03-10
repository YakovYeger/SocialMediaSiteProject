import {
	Box,
	Button,
	Flex,
	Heading,
	Link,
	Stack,
	Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { Layout } from "../components/Layout";
import { UpvootSection } from "../components/UpvootSection";
import { useMeQuery, usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
const Index = () => {
	const [variables, setVariables] = useState({
		limit: 15,
		cursor: null as null | string,
	});
	const [{ data, fetching, error }] = usePostsQuery({
		variables,
	});

	// case where the fetching must have failed how to handle?
	if (!data && !fetching) {
		return <div>{error?.message}</div>;
	}

	return (
		<Layout>
			<br />
			{/* currently loading data */}
			{!data && fetching ? (
				<div>loading...</div>
			) : (
				<Stack spacing={8}>
					{data!.posts.posts.map((p) =>
						!p ? null : (
							<Flex
								key={p.id}
								p={5}
								shadow="md"
								borderWidth="1px"
							>
								<UpvootSection post={p} />
								<Box flex={1}>
									<NextLink
										href="/post/[id]"
										as={`/post/${p.id}`}
									>
										<Link>
											<Heading fontSize="xl">
												{p.title}
											</Heading>
										</Link>
									</NextLink>
									<Text>Posted by {p.creator.username}</Text>
									<Flex>
										<Text flex={1} mt={4}>
											{p.textSnippet}
										</Text>
										<Box ml="auto">
											<EditDeletePostButtons
												id={p.id}
												creatorId={p.creator.id}
											/>
										</Box>
									</Flex>
								</Box>
							</Flex>
						)
					)}
				</Stack>
			)}
			{/* only display button if there is data */}
			{data && data.posts.hasMore ? (
				<Flex>
					<Button
						onClick={() => {
							setVariables({
								limit: variables.limit,
								cursor:
									data.posts.posts[
										data.posts.posts.length - 1
									].createdAt,
							});
						}}
						isLoading={fetching}
						bgColor="white"
						shadow="md"
						m="auto"
						my={8}
					>
						load more
					</Button>
				</Flex>
			) : null}
		</Layout>
	);
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
