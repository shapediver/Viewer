import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	INumberGradient,
	IStringGradient,
} from "@shapediver/viewer.shared.types";
import {AttributeVisualizationEngine} from "./implementation/AttributeVisualizationEngine";
import {
	AttributeVisualizationUtils,
	getColorAt,
	getColorSteps,
} from "./implementation/AttributeVisualizationUtils";
import {
	IAttribute,
	IColorAttribute,
	IDefaultAttribute,
	INumberAttribute,
	IStringAttribute,
} from "./interfaces/IAttribute";
import {IAttributeVisualizationEngine} from "./interfaces/IAttributeVisualizationEngine";
import {
	isGradient,
	isNumberGradient,
	isStringGradient,
} from "./interfaces/IGradient";
import {ILayer} from "./interfaces/ILayer";

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
