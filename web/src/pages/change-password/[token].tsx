//named this file as such so next.js knows that there is a variable in the url
import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { useState } from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrrorMap } from "../../utils/toErrorMap";
import NextLink from "next/link";

const ChangePassword: NextPage = () => {
	const router = useRouter();
	// console.log(router.query.token);
	//run the graphql mutation for changing password
	const [, changePassword] = useChangePasswordMutation();
	//create state to deal with token errors
	const [tokenError, setTokenError] = useState("");
	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ newPassword: "" }}
				onSubmit={async (values, { setErrors }) => {
					const response = await changePassword({
						newPassword: values.newPassword,
						//using router query to access token
						token:
							typeof router.query.token === "string"
								? router.query.token
								: "",
					});
					if (response.data?.changePassword.errors) {
						const errorMap = toErrrorMap(
							response.data.changePassword.errors
						);
						if ("token" in errorMap) {
							setTokenError(errorMap.token);
						}
						setErrors(errorMap);
					} else if (response.data?.changePassword.user) {
						//it worked
						router.push("/");
					}
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name="newPassword"
							placeholder="new Password"
							label="New Password"
							type="password"
						/>
						{tokenError ? (
							<Flex>
								<Box mr={4} color="red">
									{tokenError}
								</Box>
								<NextLink href="/forgot-password">
									<Link>Click Here For A New Token</Link>
								</NextLink>
							</Flex>
						) : null}
						<Button
							mt={4}
							type="submit"
							isLoading={isSubmitting}
							colorScheme="blue"
						>
							Change Password
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

//nextjs function allows for taking any query parameters and pass it to the conponent
//this is how we grab the token from the url
// ChangePassword.getInitialProps = ({ query }) => {
// 	return {
// 		token: query.token as string,
// 	};
// };
export default withUrqlClient(createUrqlClient)(ChangePassword);
