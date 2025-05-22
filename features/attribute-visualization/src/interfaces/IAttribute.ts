import {SDTF_TYPEHINT} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import {Gradient} from "./IGradient";

export enum ATTRIBUTE_VISUALIZATION {
	GRAYSCALE = "grayscale",
	OPACITY = "opacity",
	BLUE_RED = "blue_red",
	BLUE_WHITE_RED = "blue_white_red",
	GREEN_RED = "green_red",
	GREEN_WHITE_RED = "green_white_red",
	BLUE_GREEN_RED = "blue_green_red",
	BLUE_GREEN_YELLOW_RED_PURPLE_WHITE = "blue_green_yellow_red_purple_white",
	HSL = "hsl",
}
export interface IAttribute {
	key: string;
	type: SDTF_TYPEHINT;
}

export type IColorAttribute = IAttribute;

export interface INumberAttribute extends IAttribute {
	min: number;
	max: number;
	visualization: Gradient;
}

export interface IStringAttribute extends IAttribute {
	countForValue: number[];
	values: string[];
	visualization: Gradient;
}
export interface IDefaultAttribute extends IAttribute {
	color: string | vec3 | number[];
}
