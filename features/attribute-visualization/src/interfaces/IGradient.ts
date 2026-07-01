import {type IGradient} from "@shapediver/viewer.shared.types";
import {type INumberGradient, type IStringGradient} from "..";

// Type guard to check if it is a gradient
export const isGradient = (
	gradient: IGradient | string,
): gradient is INumberGradient | IStringGradient =>
	typeof gradient !== "string" &&
	(isStringGradient(gradient) || isNumberGradient(gradient));

// Type guard to check if it is a string gradient
export const isStringGradient = (
	gradient: IGradient | string,
): gradient is IStringGradient =>
	typeof gradient !== "string" && gradient.type === "string";

// Type guard to check if it is a number gradient
export const isNumberGradient = (
	gradient: IGradient | string,
): gradient is INumberGradient =>
	typeof gradient !== "string" && gradient.type === "number";
