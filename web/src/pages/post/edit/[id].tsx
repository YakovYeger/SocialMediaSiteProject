import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { useUpdatePostMutation } from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useGetIntId } from "../../../utils/useGetIntId";
import { useGetPostFromURL } from "../../../utils/useGetPostFromURL";

const EditPost = ({}) => {
	const router = useRouter();
	const intId = useGetIntId();
	const [{ data, fetching, error }] = useGetPostFromURL();
	const [, updatePost] = useUpdatePostMutation();
	if (fetching) {
		return (
			<Layout>
				<Box>Loading...</Box>
			</Layout>
		);
	}
	if (!data?.post) {
		return (
			<Layout>
				<Box>Could not find post</Box>
			</Layout>
		);
	}
	return (
		<Layout variant="small">
			<Formik
				initialValues={{ title: data.post.title, text: data.post.text }}
				onSubmit={async (values) => {
					//todo: add validation
					await updatePost({
						id: intId,
						...values,
					});
					router.back();
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name="title"
							placeholder="title"
							label="Title"
						/>
						<Box mt={4}>
							<InputField
								textarea
								name="text"
								placeholder="text..."
								label="Body"
							/>
						</Box>
						<Button
							mt={4}
							type="submit"
							isLoading={isSubmitting}
							colorScheme="blue"
						>
							update post
						</Button>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient)(EditPost);
