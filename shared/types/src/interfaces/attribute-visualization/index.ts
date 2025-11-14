export enum ATTRIBUTE_VISUALIZATION {
	GRAYSCALE = "grayscale",
	OPACITY = "opacity",
	BLUE_RED = "blue_red",
	BLUE_WHITE_RED = "blue_white_red",
	GREEN_RED = "green_red",
	GREEN_WHITE_RED = "green_white_red",
	GREEN_YELLOW_RED = "green_yellow_red",
	BLUE_YELLOW_RED = "blue_yellow_red",
	BLUE_GREEN_RED = "blue_green_red",
	BLUE_GREEN_YELLOW_RED_PURPLE_WHITE = "blue_green_yellow_red_purple_white",
	HSL = "hsl",
	VIRIDIS = "viridis",
	PLASMA = "plasma",
	TURBO = "turbo",
	MAGMA = "magma",
	CIVIDIS = "cividis",
}

export type IGradient = {
	type: "number" | "string";
};

export interface INumberGradient extends IGradient {
	type: "number";
	/** The minimum value of the gradient (default: the minimum value of the data) */
	min?: number;
	/** The maximum value of the gradient (default: the maximum value of the data) */
	max?: number;
	/** The steps of the gradient or the gradient to be used {@link ATTRIBUTE_VISUALIZATION}. */
	steps:
		| {
				/** The value of the step */
				value: number;
				/** The color before the step */
				colorBefore: string;
				/** The color after the step */
				colorAfter: string;
		  }[]
		| string;
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

// We allow the use of a gradient as a visualization for the attribute
// or the enum of a default gradient visualization
export type Gradient =
	| INumberGradient
	| IStringGradient
	| ATTRIBUTE_VISUALIZATION;
