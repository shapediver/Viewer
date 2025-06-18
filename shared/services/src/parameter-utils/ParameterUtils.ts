import {
	ResParameter,
	ResParameterType,
	ResVisualizationType,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {Converter} from "../converter/Converter";
import {InputValidator} from "../input-validator/InputValidator";
import {ShapeDiverViewerSessionError} from "../logger/ShapeDiverViewerErrors";

export const isValid = (
	definition: ResParameter,
	value: unknown,
	throwError?: boolean,
): boolean => {
	try {
		return validateParameterValue(definition, value);
	} catch (e) {
		if (throwError) throw e;
		return false;
	}
};

const validateParameterValue = (
	definition: ResParameter,
	value: unknown,
): boolean => {
	const {id, type, min, max, decimalplaces, choices, visualization} =
		definition;

	switch (true) {
		case type === ResParameterType.BOOL:
			if (typeof value === "string") {
				if (!(value === "true" || value === "false"))
					throw new ShapeDiverViewerSessionError(
						`Parameter(${id}).isValid: The value ${value} is a string that is neither true or false.`,
					);
			} else {
				InputValidator.instance.validateAndError(
					`Parameter(${id}).isValid`,
					value,
					"boolean",
				);
			}
			break;
		case type === ResParameterType.COLOR:
			InputValidator.instance.validateAndError(
				`Parameter(${id}).isValid`,
				value,
				"color",
			);
			break;
		case type === ResParameterType.FILE:
			InputValidator.instance.validateAndError(
				`Parameter(${id}).isValid`,
				value,
				"file",
			);
			break;
		case type === ResParameterType.EVEN ||
			type === ResParameterType.FLOAT ||
			type === ResParameterType.INT ||
			type === ResParameterType.ODD:
			{
				let temp = value as number;
				if (typeof value === "string") temp = +value;
				InputValidator.instance.validateAndError(
					`Parameter(${id}).isValid`,
					temp,
					"number",
				);
				if (type === ResParameterType.EVEN) {
					if (temp % 2 !== 0)
						throw new ShapeDiverViewerSessionError(
							`Parameter(${id}).isValid: The value ${value} is not even.`,
						);
				} else if (type === ResParameterType.ODD) {
					if (temp % 2 === 0)
						throw new ShapeDiverViewerSessionError(
							`Parameter(${id}).isValid: The value ${value} is not odd.`,
						);
				} else if (type === ResParameterType.INT) {
					if (!Number.isInteger(temp))
						throw new ShapeDiverViewerSessionError(
							`Parameter(${id}).isValid: The value ${value} is not an integer.`,
						);
				}
				if (min || min === 0)
					if (temp < min)
						throw new ShapeDiverViewerSessionError(
							`Parameter(${id}).isValid: The value ${value} is smaller than the minimum ${min}.`,
						);

				if (max || max === 0)
					if (temp > max)
						throw new ShapeDiverViewerSessionError(
							`Parameter(${id}).isValid: The value ${value} is larger than the maximum ${max}.`,
						);

				if (decimalplaces || decimalplaces === 0) {
					const numStr = temp + "";
					let decimalplaces = 0;
					if (numStr.includes("."))
						decimalplaces = numStr.split(".")[1].length;
					if (decimalplaces < decimalplaces)
						throw new ShapeDiverViewerSessionError(
							`Parameter(${id}).isValid: The value ${value} has not the correct number of decimalplaces (${decimalplaces}).`,
						);
				}
			}
			break;
		case type === ResParameterType.STRINGLIST: {
			InputValidator.instance.validateAndError(
				`Parameter(${id}).isValid`,
				value,
				"string",
			);
			const choicesChecker = (v: string) => {
				// has to be a single value that is
				// 1. convertible to number
				// 2. between 0 and choices.length -1
				const temp = +v;
				InputValidator.instance.validateAndError(
					`Parameter(${id}).isValid`,
					temp,
					"number",
				);
				if (temp < 0 || temp > choices!.length - 1)
					throw new ShapeDiverViewerSessionError(
						`Parameter(${id}).isValid: The value ${v} is not within the range of the defined number choices.`,
					);
			};

			if (visualization === ResVisualizationType.CHECKLIST) {
				// comma separated numbers
				if ((value as string).includes(",")) {
					const values: string[] = (value as string).split(",");
					for (let i = 0; i < values.length; i++) {
						if (
							values.filter((item) => item === values[i])
								.length !== 1
						)
							throw new ShapeDiverViewerSessionError(
								`Parameter(${id}).isValid: The value ${values[i]} exists multiple times, but should only exist once.`,
							);
						choicesChecker(values[i]);
					}
				} else {
					// to number
					let temp = value as number;
					if (typeof value === "string") temp = +value;
					InputValidator.instance.validateAndError(
						`Parameter(${id}).isValid`,
						temp,
						"number",
					);
					choicesChecker(value as string);
				}
			} else {
				// to number
				let temp = value as number;
				if (typeof value === "string") temp = +value;
				InputValidator.instance.validateAndError(
					`Parameter(${id}).isValid`,
					temp,
					"number",
				);
				choicesChecker(value as string);
			}
			break;
		}
		default:
			InputValidator.instance.validateAndError(
				`Parameter(${id}).isValid`,
				value,
				"string",
			);
			break;
	}
	return true;
};

export const stringify = (definition: ResParameter, value: unknown): string => {
	const {id, type, decimalplaces} = definition;

	switch (true) {
		case type === ResParameterType.BOOL:
			return typeof value === "string"
				? value
				: <boolean>(<unknown>value) + "";
		case type === ResParameterType.COLOR:
			return Converter.instance.toHex8Color(value);
		case type === ResParameterType.FILE:
			if (typeof value !== "string")
				throw new ShapeDiverViewerSessionError(
					`Parameter(${id}).stringify: Error in stringify. Cannot stringify FileParameter that has not been uploaded yet.`,
				);
			return <string>value;
		case type === ResParameterType.EVEN ||
			type === ResParameterType.FLOAT ||
			type === ResParameterType.INT ||
			type === ResParameterType.ODD:
			if (typeof value === "string") {
				// cast to number and round to decimalplaces if they exist
				if (decimalplaces || decimalplaces === 0) {
					const number = +value;
					return number.toFixed(decimalplaces);
				} else {
					return value;
				}
			} else {
				// round to decimalplaces if they exist
				if (decimalplaces || decimalplaces === 0) {
					return (<number>(<unknown>value)).toFixed(decimalplaces);
				} else {
					return <number>(<unknown>value) + "";
				}
			}
		default:
			return <string>value;
	}
};
