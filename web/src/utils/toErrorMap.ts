import { FieldError } from "../generated/graphql";

//map of the array of errors
export const toErrrorMap = (errors: FieldError[]) => {
	const errorMap: Record<string, string> = {};
	errors.forEach(({ field, message }) => {
		errorMap[field] = message;
	});

	return errorMap;
};
