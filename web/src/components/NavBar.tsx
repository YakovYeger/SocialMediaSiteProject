import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { EditIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	const router = useRouter();
	const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
	const [{ data, fetching }] = useMeQuery({
		pause: isServer(),
	});
	let body = null;

	//data is loading
	if (fetching) {
		//user not logged in
	} else if (!data?.me) {
		body = (
			<>
				<NextLink href="/login">
					<Link color="white" mr={4}>
						Login
					</Link>
				</NextLink>
				<NextLink href="/register">
					<Link color="white">Register</Link>
				</NextLink>
			</>
		);

		//user is logged in
	} else {
		body = (
			<Flex align="center">
				<NextLink href="/create-post">
					<Button rightIcon={<EditIcon />} as={Link} mr={4}>
						create post
					</Button>
				</NextLink>
				<Box mr={2}>{data.me.username}</Box>
				<Button
					onClick={async () => {
						await logout();
						router.reload();
					}}
					isLoading={logoutFetching}
					variant="link"
				>
					Logout
				</Button>
			</Flex>
		);
	}
	return (
		<Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
			<Flex maxW={800} flex={1} m="auto" align="center">
				<NextLink href="/">
					<Link>
						<Heading colorScheme="blackAlpha" color="blackAlpha">
							WriteDowns
						</Heading>
					</Link>
				</NextLink>

				<Box ml={"auto"}>{body}</Box>
			</Flex>
		</Flex>
	);
};
