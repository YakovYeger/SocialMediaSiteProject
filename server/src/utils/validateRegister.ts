import { userNamePasswordInput } from "src/resolvers/userNamePasswordInput";

export const validateRegister = (options: userNamePasswordInput) => {
	//email validation
	if (!options.email.includes("@")) {
		return [
			{
				field: "email",
				message: "invalid email: email must include @ ",
			},
		];
	}
	//simple validation for user creation
	if (options.username.length <= 2) {
		return;
		[
			{
				field: "username",
				message: "username must be longer than two characters",
			},
		];
	}
	if (options.username.includes("@")) {
		return [
			{
				field: "username",
				message: "username may not contain @",
			},
		];
	}
	// simple validation for password creation
	if (options.password.length <= 4) {
		return [
			{
				field: "password",
				message: "password must be longer than four characters",
			},
		];
	}

	return null;
};
