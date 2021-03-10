import { usePostQuery } from "../generated/graphql";
import { useGetIntId } from "./useGetIntId";

export const useGetPostFromURL = () => {
	const intID = useGetIntId();
	return usePostQuery({
		pause: intID === -1, //dont do query- we got a bad url parameter
		variables: {
			id: intID,
		},
	});
};
