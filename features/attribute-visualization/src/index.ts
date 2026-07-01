import {
	ATTRIBUTE_VISUALIZATION,
	type Gradient,
	type INumberGradient,
	type IStringGradient} from "@shapediver/viewer.shared.types";
import {AttributeVisualizationEngine} from "./implementation/AttributeVisualizationEngine";
import {
	AttributeVisualizationUtils,
	getColorAt,
	getColorSteps} from "./implementation/AttributeVisualizationUtils";
import {
	type IAttribute,
	type IColorAttribute,
	type IDefaultAttribute,
	type INumberAttribute,
	type IStringAttribute} from "./interfaces/IAttribute";
import {type IAttributeVisualizationEngine} from "./interfaces/IAttributeVisualizationEngine";
import {
	isGradient,
	isNumberGradient,
	isStringGradient} from "./interfaces/IGradient";
import {type ILayer} from "./interfaces/ILayer";

export {
	ATTRIBUTE_VISUALIZATION,
	AttributeVisualizationEngine,
	AttributeVisualizationUtils,
	getColorAt,
	getColorSteps,
	isGradient,
	isNumberGradient,
	isStringGradient,
};
export type {
	Gradient,
	IAttribute,
	IAttributeVisualizationEngine,
	IColorAttribute,
	IDefaultAttribute,
	ILayer,
	INumberAttribute,
	INumberGradient,
	IStringAttribute,
	IStringGradient,
};
