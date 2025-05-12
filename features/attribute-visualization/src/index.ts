import {AttributeVisualizationEngine} from "./implementation/AttributeVisualizationEngine";
import {
	ATTRIBUTE_VISUALIZATION,
	IAttribute,
	IColorAttribute,
	IDefaultAttribute,
	INumberAttribute,
	IStringAttribute,
} from "./interfaces/IAttribute";
import {IAttributeVisualizationEngine} from "./interfaces/IAttributeVisualizationEngine";
import {
	Gradient,
	INumberGradient,
	isGradient,
	isNumberGradient,
	isStringGradient,
	IStringGradient,
} from "./interfaces/IGradient";
import {ILayer} from "./interfaces/ILayer";

export {
	INumberGradient,
	isGradient,
	isNumberGradient,
	isStringGradient,
	IStringGradient,
	Gradient,
};
export {IAttributeVisualizationEngine, AttributeVisualizationEngine};
export {
	ILayer,
	IAttribute,
	IColorAttribute,
	IStringAttribute,
	INumberAttribute,
	IDefaultAttribute,
};
export {ATTRIBUTE_VISUALIZATION};
