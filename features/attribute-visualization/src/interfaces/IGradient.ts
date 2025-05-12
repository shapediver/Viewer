import {Color} from "@shapediver/viewer.shared.types";
import {ATTRIBUTE_VISUALIZATION} from "./IAttribute";

type IGradient = {
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
		colorBefore: Color;
		/** The color after the step */
		colorAfter: Color;
		/** The optional label of the step (default: value) */
		label?: string;
	}[];
}

export interface IStringGradient extends IGradient {
	type: "string";
	/** The steps of the gradient */
	steps: {
		/** The value of the step */
		values: string[];
		/** The color used for the values */
		color: Color;
	}[];
}

// Type guard to check if it is a gradient
export const isGradient = (
	gradient: IGradient,
): gradient is INumberGradient | IStringGradient =>
	gradient.type === "number" || gradient.type === "string";

// Type guard to check if it is a string gradient
export const isStringGradient = (
	gradient: IGradient,
): gradient is IStringGradient => gradient.type === "string";

// Type guard to check if it is a number gradient
export const isNumberGradient = (
	gradient: IGradient,
): gradient is INumberGradient => gradient.type === "number";

// We allow the use of a gradient as a visualization for the attribute
// or the enum of a default gradient visualization
export type Gradient =
	| INumberGradient
	| IStringGradient
	| ATTRIBUTE_VISUALIZATION;
