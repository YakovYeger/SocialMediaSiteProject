import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
	PostSnippetFragment,
	PostsQuery,
	useVoteMutation,
} from "../generated/graphql";

interface UpvootSectionProps {
	post: PostSnippetFragment; //equivalent lines but this is prettier to look at
	//PostsQuery["posts"]["posts"][0];
}

export const UpvootSection: React.FC<UpvootSectionProps> = ({ post }) => {
	const [loadingState, setLoadingState] = useState<
		"upvoot-loading" | "downvoot-loading" | "not-loading"
	>("not-loading");
	const [, vote] = useVoteMutation();
	return (
		<Flex
			direction="column"
			justifyContent="center"
			alignItems="center"
			mr={4}
		>
			<IconButton
				aria-label="upvoot post"
				icon={<ChevronUpIcon w={6} h={8} />}
				onClick={async () => {
					if (post.voteStatus === 1) {
						return;
					}
					setLoadingState("upvoot-loading");
					await vote({
						postId: post.id,
						value: 1,
					});
					setLoadingState("not-loading");
				}}
				colorScheme={post.voteStatus === 1 ? "green" : undefined}
				isLoading={loadingState === "upvoot-loading"}
			/>
			{post.points}
			<IconButton
				aria-label="downvoot post"
				icon={<ChevronDownIcon w={6} h={8} />}
				onClick={async () => {
					if (post.voteStatus === -1) {
						return;
					}
					setLoadingState("downvoot-loading");
					await vote({
						postId: post.id,
						value: -1,
					});
					setLoadingState("not-loading");
				}}
				isLoading={loadingState === "downvoot-loading"}
				colorScheme={post.voteStatus === -1 ? "red" : undefined}
			/>
		</Flex>
	);
};
