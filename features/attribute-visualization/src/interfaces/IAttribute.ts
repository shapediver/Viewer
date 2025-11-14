import {Gradient, SDTF_TYPEHINT} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
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
