import {Converter} from "@shapediver/viewer.shared.services";
import {
	Color,
	IMaterialAbstractData,
	ISDTFAttributeVisualizationData,
	MaterialStandardData,
	MaterialUnlitData,
} from "@shapediver/viewer.shared.types";
import {mat4} from "gl-matrix";
import {ATTRIBUTE_VISUALIZATION} from "../interfaces/IAttribute";
import {
	Gradient,
	IGradient,
	INumberGradient,
	isNumberGradient,
	isStringGradient,
	IStringGradient,
} from "../interfaces/IGradient";

export const getColorSteps = (
	gradient: ATTRIBUTE_VISUALIZATION,
):
	| {
			value: number;
			colorBefore: string;
			colorAfter: string;
	  }[]
	| undefined => {
	switch (gradient) {
		case ATTRIBUTE_VISUALIZATION.GRAYSCALE:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 0, 0)",
					colorAfter: "rgb(0, 0, 0)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 255, 255)",
					colorAfter: "rgb(255, 255, 255)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.BLUE_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 0, 255)",
					colorAfter: "rgb(0, 0, 255)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.BLUE_WHITE_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 0, 255)",
					colorAfter: "rgb(0, 0, 255)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(255, 255, 255)",
					colorAfter: "rgb(255, 255, 255)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.GREEN_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 255, 0)",
					colorAfter: "rgb(0, 255, 0)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 255, 0)",
					colorAfter: "rgb(0, 255, 0)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(255, 255, 255)",
					colorAfter: "rgb(255, 255, 255)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.GREEN_YELLOW_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 255, 0)",
					colorAfter: "rgb(0, 255, 0)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(255, 255, 0)",
					colorAfter: "rgb(255, 255, 0)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.BLUE_YELLOW_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 0, 255)",
					colorAfter: "rgb(0, 0, 255)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(255, 255, 0)",
					colorAfter: "rgb(255, 255, 0)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 0, 255)",
					colorAfter: "rgb(0, 0, 255)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(0, 255, 0)",
					colorAfter: "rgb(0, 255, 0)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
			return [
				{
					value: 0,
					colorBefore: "rgb(0, 0, 255)",
					colorAfter: "rgb(0, 0, 255)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(0, 255, 0)",
					colorAfter: "rgb(0, 255, 0)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(255, 255, 0)",
					colorAfter: "rgb(255, 255, 0)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(255, 0, 255)",
					colorAfter: "rgb(255, 0, 255)",
				},
				{
					value: 1,
					colorBefore: "rgb(255, 255, 255)",
					colorAfter: "rgb(255, 255, 255)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.VIRIDIS:
			return [
				{
					value: 0.0,
					colorBefore: "rgb(68, 1, 84)",
					colorAfter: "rgb(68, 1, 84)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(65, 44, 123)",
					colorAfter: "rgb(65, 44, 123)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(52, 83, 138)",
					colorAfter: "rgb(52, 83, 138)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(38, 119, 140)",
					colorAfter: "rgb(38, 119, 140)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(31, 144, 137)",
					colorAfter: "rgb(31, 144, 137)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(37, 170, 121)",
					colorAfter: "rgb(37, 170, 121)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(86, 193, 90)",
					colorAfter: "rgb(86, 193, 90)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(150, 211, 45)",
					colorAfter: "rgb(150, 211, 45)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(218, 230, 35)",
					colorAfter: "rgb(218, 230, 35)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(253, 231, 36)",
					colorAfter: "rgb(253, 231, 36)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(252, 254, 178)",
					colorAfter: "rgb(252, 254, 178)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.PLASMA:
			return [
				{
					value: 0.0,
					colorBefore: "rgb(13, 8, 135)",
					colorAfter: "rgb(13, 8, 135)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(75, 3, 161)",
					colorAfter: "rgb(75, 3, 161)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(125, 3, 168)",
					colorAfter: "rgb(125, 3, 168)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(168, 34, 150)",
					colorAfter: "rgb(168, 34, 150)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(203, 70, 121)",
					colorAfter: "rgb(203, 70, 121)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(229, 107, 93)",
					colorAfter: "rgb(229, 107, 93)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(248, 148, 65)",
					colorAfter: "rgb(248, 148, 65)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(253, 195, 40)",
					colorAfter: "rgb(253, 195, 40)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(240, 242, 51)",
					colorAfter: "rgb(240, 242, 51)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(210, 252, 98)",
					colorAfter: "rgb(210, 252, 98)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(254, 255, 178)",
					colorAfter: "rgb(254, 255, 178)",
				},
			];
			return [
				{
					value: 0.0,
					colorBefore: "rgb(0, 0, 127)",
					colorAfter: "rgb(0, 0, 127)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(0, 0, 191)",
					colorAfter: "rgb(0, 0, 191)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(0, 0, 255)",
					colorAfter: "rgb(0, 0, 255)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(63, 63, 255)",
					colorAfter: "rgb(63, 63, 255)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(127, 127, 255)",
					colorAfter: "rgb(127, 127, 255)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(255, 255, 255)",
					colorAfter: "rgb(255, 255, 255)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(255, 127, 127)",
					colorAfter: "rgb(255, 127, 127)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(255, 63, 63)",
					colorAfter: "rgb(255, 63, 63)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(255, 0, 0)",
					colorAfter: "rgb(255, 0, 0)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(191, 0, 0)",
					colorAfter: "rgb(191, 0, 0)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(127, 0, 0)",
					colorAfter: "rgb(127, 0, 0)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.TURBO:
			return [
				{
					value: 0.0,
					colorBefore: "rgb(48, 18, 59)",
					colorAfter: "rgb(48, 18, 59)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(55, 47, 122)",
					colorAfter: "rgb(55, 47, 122)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(23, 111, 171)",
					colorAfter: "rgb(23, 111, 171)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(16, 153, 142)",
					colorAfter: "rgb(16, 153, 142)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(69, 186, 99)",
					colorAfter: "rgb(69, 186, 99)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(165, 202, 65)",
					colorAfter: "rgb(165, 202, 65)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(234, 190, 70)",
					colorAfter: "rgb(234, 190, 70)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(251, 142, 79)",
					colorAfter: "rgb(251, 142, 79)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(243, 87, 65)",
					colorAfter: "rgb(243, 87, 65)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(224, 37, 77)",
					colorAfter: "rgb(224, 37, 77)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(127, 0, 45)",
					colorAfter: "rgb(127, 0, 45)",
				},
			];
			return [
				{
					value: 0.0,
					colorBefore: "rgb(0, 0, 3)",
					colorAfter: "rgb(0, 0, 3)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(31, 12, 72)",
					colorAfter: "rgb(31, 12, 72)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(85, 15, 109)",
					colorAfter: "rgb(85, 15, 109)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(136, 34, 106)",
					colorAfter: "rgb(136, 34, 106)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(186, 54, 85)",
					colorAfter: "rgb(186, 54, 85)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(227, 89, 51)",
					colorAfter: "rgb(227, 89, 51)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(249, 140, 10)",
					colorAfter: "rgb(249, 140, 10)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(252, 190, 57)",
					colorAfter: "rgb(252, 190, 57)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(241, 237, 105)",
					colorAfter: "rgb(241, 237, 105)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(252, 253, 191)",
					colorAfter: "rgb(252, 253, 191)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(252, 254, 164)",
					colorAfter: "rgb(252, 254, 164)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.MAGMA:
			return [
				{
					value: 0.0,
					colorBefore: "rgb(0, 0, 4)",
					colorAfter: "rgb(0, 0, 4)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(28, 16, 68)",
					colorAfter: "rgb(28, 16, 68)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(79, 18, 123)",
					colorAfter: "rgb(79, 18, 123)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(129, 37, 129)",
					colorAfter: "rgb(129, 37, 129)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(178, 65, 114)",
					colorAfter: "rgb(178, 65, 114)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(221, 104, 89)",
					colorAfter: "rgb(221, 104, 89)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(251, 150, 62)",
					colorAfter: "rgb(251, 150, 62)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(254, 198, 83)",
					colorAfter: "rgb(254, 198, 83)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(237, 243, 129)",
					colorAfter: "rgb(237, 243, 129)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(252, 254, 191)",
					colorAfter: "rgb(252, 254, 191)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(252, 254, 164)",
					colorAfter: "rgb(252, 254, 164)",
				},
			];
		case ATTRIBUTE_VISUALIZATION.CIVIDIS:
			return [
				{
					value: 0.0,
					colorBefore: "rgb(0, 32, 76)",
					colorAfter: "rgb(0, 32, 76)",
				},
				{
					value: 0.1,
					colorBefore: "rgb(20, 53, 96)",
					colorAfter: "rgb(20, 53, 96)",
				},
				{
					value: 0.2,
					colorBefore: "rgb(48, 75, 108)",
					colorAfter: "rgb(48, 75, 108)",
				},
				{
					value: 0.3,
					colorBefore: "rgb(82, 95, 115)",
					colorAfter: "rgb(82, 95, 115)",
				},
				{
					value: 0.4,
					colorBefore: "rgb(120, 113, 114)",
					colorAfter: "rgb(120, 113, 114)",
				},
				{
					value: 0.5,
					colorBefore: "rgb(159, 130, 109)",
					colorAfter: "rgb(159, 130, 109)",
				},
				{
					value: 0.6,
					colorBefore: "rgb(195, 145, 99)",
					colorAfter: "rgb(195, 145, 99)",
				},
				{
					value: 0.7,
					colorBefore: "rgb(227, 158, 85)",
					colorAfter: "rgb(227, 158, 85)",
				},
				{
					value: 0.8,
					colorBefore: "rgb(251, 171, 71)",
					colorAfter: "rgb(251, 171, 71)",
				},
				{
					value: 0.9,
					colorBefore: "rgb(254, 200, 116)",
					colorAfter: "rgb(254, 200, 116)",
				},
				{
					value: 1.0,
					colorBefore: "rgb(252, 255, 164)",
					colorAfter: "rgb(252, 255, 164)",
				},
			];
		default:
			return;
	}
};

export const getColorAt = (
	gradient: ATTRIBUTE_VISUALIZATION,
	factor: number,
): string | undefined => {
	const steps = getColorSteps(gradient);
	if (!steps) return;
	for (let i = 0; i < steps.length; i++) {
		if (steps[i].value >= factor) {
			// check if the value is the first step
			if (i === 0) {
				return steps[i].colorBefore;
			} else {
				// get the previous color
				const previousColor = steps[i - 1].colorAfter;
				// get the current color
				const currentColor = steps[i].colorBefore;

				// calculate where the factor is between the two colors
				const stepFactor =
					(factor - steps[i - 1].value) /
					(steps[i].value - steps[i - 1].value);

				// return interpolated color
				return interpolateColors(
					previousColor,
					currentColor,
					stepFactor,
				);
			}
		}
	}
};

const opacityVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
	defaultMaterial: IMaterialAbstractData,
): ISDTFAttributeVisualizationData => {
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color: defaultMaterial.color,
						opacity: factor,
					})
				: new MaterialStandardData({
						color: defaultMaterial.color,
						opacity: factor,
					}),
		matrix: mat4.create(),
	};
};

const hslVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	const hue = factor * 359.99;
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color: "hsl(" + Math.floor(hue) + ", 100%, 50%)",
						opacity: 1,
					})
				: new MaterialStandardData({
						color: "hsl(" + Math.floor(hue) + ", 100%, 50%)",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
};

const interpolateColors = (
	color1: Color,
	color2: Color,
	factor: number,
): string => {
	const converter = Converter.instance;
	const colorArray1 = converter.toColorArray(color1);
	const colorArray2 = converter.toColorArray(color2);

	// Interpolate the colors
	const r = colorArray1[0] + factor * (colorArray2[0] - colorArray1[0]);
	const g = colorArray1[1] + factor * (colorArray2[1] - colorArray1[1]);
	const b = colorArray1[2] + factor * (colorArray2[2] - colorArray1[2]);

	// Convert the interpolated color back to a hex string
	return converter.toHexColor([r * 256, g * 256, b * 256]);
};

const numberGradientVisualization = (
	factor: number,
	gradient: INumberGradient,
): ISDTFAttributeVisualizationData | undefined => {
	if (typeof gradient.steps === "string") return;

	for (let i = 0; i < gradient.steps.length; i++) {
		if (gradient.steps[i].value >= factor) {
			// check if the value is the first step
			if (i === 0) {
				return {
					material: new MaterialStandardData({
						color: gradient.steps[i].colorBefore,
						opacity: 1,
					}),
					matrix: mat4.create(),
				};
			} else {
				// get the previous color
				const previousColor = gradient.steps[i - 1].colorAfter;
				// get the current color
				const currentColor = gradient.steps[i].colorBefore;

				// calculate where the factor is between the two colors
				const stepFactor =
					(factor - gradient.steps[i - 1].value) /
					(gradient.steps[i].value - gradient.steps[i - 1].value);

				// return interpolated color
				return {
					material: new MaterialStandardData({
						color: interpolateColors(
							previousColor,
							currentColor,
							stepFactor,
						),
						opacity: 1,
					}),
					matrix: mat4.create(),
				};
			}
		}
	}

	// return the after color of the last step
	return {
		material: new MaterialStandardData({
			color: gradient.steps[gradient.steps.length - 1].colorAfter,
			opacity: 1,
		}),
		matrix: mat4.create(),
	};
};

const stringGradientVisualization = (
	value: string,
	gradient: IStringGradient,
): ISDTFAttributeVisualizationData => {
	const steps = gradient.labelColors;
	const stepCount = steps.length;

	let color = gradient.defaultColor || "rgb(128, 128, 128)";

	for (let i = 0; i < stepCount; i++) {
		if (steps[i].values.includes(value)) {
			color = steps[i].color;
			break;
		}
	}

	return {
		material: new MaterialStandardData({
			color: color,
			opacity: 1,
		}),
		matrix: mat4.create(),
	};
};

const numberVisualization = (
	value: number,
	min: number,
	max: number,
	type: Gradient,
	materialType: "unlit" | "standard",
	defaultMaterial: IMaterialAbstractData,
): ISDTFAttributeVisualizationData | undefined => {
	let factor = (value - min) / (max - min);
	if (isNaN(factor)) factor = 0.5;
	// check if the type is part of the enum
	if (typeof type === "string") {
		const color = getColorAt(type, factor);
		if (color) {
			return {
				material:
					materialType === "unlit"
						? new MaterialUnlitData({
								color: color,
								opacity: 1,
							})
						: new MaterialStandardData({
								color: color,
								opacity: 1,
							}),
				matrix: mat4.create(),
			};
		} else if (type === ATTRIBUTE_VISUALIZATION.OPACITY) {
			return opacityVisualization(factor, materialType, defaultMaterial);
		} else if (type === ATTRIBUTE_VISUALIZATION.HSL) {
			return hslVisualization(factor, materialType);
		}
	} else {
		if (isNumberGradient(type as IGradient)) {
			// check if the steps are a string
			if (typeof (type as INumberGradient).steps === "string") {
				// if so, we use the default gradient visualization
				return numberVisualization(
					value,
					min,
					max,
					(type as INumberGradient).steps as ATTRIBUTE_VISUALIZATION,
					materialType,
					defaultMaterial,
				);
			}
			return numberGradientVisualization(factor, type as INumberGradient);
		}
	}
};

const stringVisualization = (
	value: string,
	values: string[],
	type: Gradient,
	materialType: "unlit" | "standard",
	defaultMaterial: IMaterialAbstractData,
): ISDTFAttributeVisualizationData | undefined => {
	let factor = values.indexOf(value) / (values.length - 1);
	if (isNaN(factor)) factor = 0.5;
	// check if the type is part of the enum
	if (typeof type === "string") {
		const color = getColorAt(type, factor);
		if (color) {
			return {
				material:
					materialType === "unlit"
						? new MaterialUnlitData({
								color: color,
								opacity: 1,
							})
						: new MaterialStandardData({
								color: color,
								opacity: 1,
							}),
				matrix: mat4.create(),
			};
		} else if (type === ATTRIBUTE_VISUALIZATION.OPACITY) {
			return opacityVisualization(factor, materialType, defaultMaterial);
		} else if (type === ATTRIBUTE_VISUALIZATION.HSL) {
			return hslVisualization(factor, materialType);
		}
	} else {
		if (isStringGradient(type as IGradient)) {
			return stringGradientVisualization(value, type as IStringGradient);
		}
	}
};

export const AttributeVisualizationUtils = {
	numberVisualization,
	stringVisualization,
};
