import { Box, Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React from "react";
import { EditDeletePostButtons } from "../../components/EditDeletePostButtons";
import { Layout } from "../../components/Layout";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useGetPostFromURL } from "../../utils/useGetPostFromURL";

const Post = ({}) => {
	const [{ data, fetching, error }] = useGetPostFromURL();
	//4 possible cases- fetching data | error | couldnt find post | found post and displaying
	if (fetching) {
		return (
			<Layout>
				<div>loading...</div>
			</Layout>
		);
	}
	if (error) {
		return <div>{error.message}</div>;
	}
	if (!data?.post) {
		return (
			<Layout>
				<Box>Could not find post</Box>
			</Layout>
		);
	}

	return (
		<Layout>
			<Box>
				<Heading mb={4}>{data.post.title}</Heading>
				<Box mb={4}>{data.post.text}</Box>
				<EditDeletePostButtons
					id={data.post.id}
					creatorId={data.post.creator.id}
				/>
			</Box>
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
