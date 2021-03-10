import { Box, Flex, Link, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useForgotPasswordMutation } from "../generated/graphql";

const ForgotPassword: React.FC<{}> = ({}) => {
	const [, forgotPassword] = useForgotPasswordMutation();
	const [complete, setComplete] = useState(false);
	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ email: "" }}
				onSubmit={async (values) => {
					await forgotPassword(values);
					setComplete(true);
				}}
			>
				{({ isSubmitting }) =>
					complete ? (
						<Box>Sent you an email to create a new password</Box>
					) : (
						<Form>
							<Box mt={4}>
								<InputField
									name="email"
									placeholder="email"
									label="Email"
									type="email"
								/>
							</Box>
							<Button
								mt={4}
								type="submit"
								isLoading={isSubmitting}
								colorScheme="blue"
							>
								Create New Password
							</Button>
						</Form>
					)
				}
			</Formik>
		</Wrapper>
	);
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
