import {ATTRIBUTE_VISUALIZATION} from "./IAttribute";

export type IGradient = {
	type: "number" | "string";
};

export interface INumberGradient extends IGradient {
	type: "number";
	/** The minimum value of the gradient (default: the minimum value of the data) */
	min?: number;
	/** The maximum value of the gradient (default: the maximum value of the data) */
	max?: number;
	/** The steps of the gradient */
	steps: {
		/** The value of the step */
		value: number;
		/** The color before the step */
		colorBefore: string;
		/** The color after the step */
		colorAfter: string;
	}[];
}

export interface IStringGradient extends IGradient {
	type: "string";
	/** The default color that is used if the value is not in the steps (default: grey) */
	defaultColor?: string;
	/** The colors used for the values */
	labelColors: {
		/** The value of the step */
		values: string[];
		/** The color used for the values */
		color: string;
	}[];
}

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

// We allow the use of a gradient as a visualization for the attribute
// or the enum of a default gradient visualization
export type Gradient =
	| INumberGradient
	| IStringGradient
	| ATTRIBUTE_VISUALIZATION;
