import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	Textarea,
	ComponentWithAs,
	InputProps,
	TextareaProps,
} from "@chakra-ui/react";
import { useField } from "formik";
import React from "react";
import { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
	name: string;
	placeholder?: string;
	label: string;
	textarea?: boolean;
};
type InputOrTextArea =
	| ComponentWithAs<"input", InputProps>
	| ComponentWithAs<"textarea", TextareaProps>;
//" " => fals
//"error message of some sort" => true
export const InputField: React.FC<InputFieldProps> = ({
	label,
	textarea,
	size: _,
	placeholder,
	...props
}) => {
	let InputOrTextArea: InputOrTextArea = Input;
	if (textarea) {
		InputOrTextArea = Textarea;
	}
	const [field, { error }] = useField(props);
	return (
		<FormControl isInvalid={!!error}>
			<FormLabel htmlFor={field.name}>{label}</FormLabel>
			<InputOrTextArea
				{...field}
				{...props}
				id={field.name}
				placeholder={placeholder}
			/>
			{error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
		</FormControl>
	);
};
