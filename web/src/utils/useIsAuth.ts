import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
	const [{ data, fetching }] = useMeQuery();
	const router = useRouter();
	useEffect(() => {
		if (!fetching && !data?.me) {
			//tell the router where to go after login
			router.replace("/login?next=" + router.pathname);
		}
	}, [fetching, data, router]);
};
