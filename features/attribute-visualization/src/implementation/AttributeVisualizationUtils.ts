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

const grayscaleVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	const color = Math.floor(factor * 255.0);
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" + color + ", " + color + ", " + color + ")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" + color + ", " + color + ", " + color + ")",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
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

const blueRedVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	const red = factor * 255.0;
	const blue = (1 - factor) * 255.0;
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(0) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(0) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
};

const blueWhiteRedVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	let red = 255,
		green = 255,
		blue = 255;

	if (factor < 0.5) {
		const remappedFactor = factor / 0.5;
		red = 255.0 * remappedFactor;
		green = 255.0 * remappedFactor;
		blue = 255.0;
	} else {
		const remappedFactor = (factor - 0.5) / 0.5;
		red = 255.0;
		green = 255.0 * (1 - remappedFactor);
		blue = 255.0 * (1 - remappedFactor);
	}
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
};

const greenRedVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	const red = factor * 255.0;
	const green = (1 - factor) * 255.0;
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(0) +
							")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(0) +
							")",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
};

const greenWhiteRedVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	let red = 255,
		green = 255,
		blue = 255;

	if (factor < 0.5) {
		const remappedFactor = factor / 0.5;
		red = 255.0 * remappedFactor;
		green = 255.0;
		blue = 255.0 * remappedFactor;
	} else {
		const remappedFactor = (factor - 0.5) / 0.5;
		red = 255.0;
		green = 255.0 * (1 - remappedFactor);
		blue = 255.0 * (1 - remappedFactor);
	}
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
};

const blueGreenRedVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	let red = 255,
		green = 255,
		blue = 255;

	if (factor < 0.5) {
		const remappedFactor = factor / 0.5;
		red = 0;
		green = 255.0 * remappedFactor;
		blue = 255.0 * (1 - remappedFactor);
	} else {
		const remappedFactor = (factor - 0.5) / 0.5;
		red = 255.0 * remappedFactor;
		green = 255.0 * (1 - remappedFactor);
		blue = 0;
	}
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					}),
		matrix: mat4.create(),
	};
};

const blueGreenYellowRedPurpleWhiteVisualization = (
	factor: number,
	materialType: "unlit" | "standard",
): ISDTFAttributeVisualizationData => {
	let red = 255,
		green = 255,
		blue = 255;

	if (factor < 0.2) {
		const remappedFactor = factor / 0.2;
		red = 0;
		green = 255.0 * remappedFactor;
		blue = 255.0 * (1 - remappedFactor);
	} else if (factor < 0.4) {
		const remappedFactor = (factor - 0.2) / 0.2;
		red = 255.0 * remappedFactor;
		green = 255.0;
		blue = 0.0;
	} else if (factor < 0.6) {
		const remappedFactor = (factor - 0.4) / 0.2;
		red = 255.0;
		green = 255.0 * (1 - remappedFactor);
		blue = 0.0;
	} else if (factor < 0.8) {
		const remappedFactor = (factor - 0.6) / 0.2;
		red = 255.0;
		green = 0.0;
		blue = 255.0 * remappedFactor;
	} else {
		const remappedFactor = (factor - 0.8) / 0.2;
		red = 255.0;
		green = 255.0 * remappedFactor;
		blue = 255.0;
	}
	return {
		material:
			materialType === "unlit"
				? new MaterialUnlitData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
					})
				: new MaterialStandardData({
						color:
							"rgb(" +
							Math.floor(red) +
							", " +
							Math.floor(green) +
							", " +
							Math.floor(blue) +
							")",
						opacity: 1,
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

	const r = Math.floor(
		colorArray1[0] + (colorArray2[0] - colorArray1[0]) * factor,
	);
	const g = Math.floor(
		colorArray1[1] + (colorArray2[1] - colorArray1[1]) * factor,
	);
	const b = Math.floor(
		colorArray1[2] + (colorArray2[2] - colorArray1[2]) * factor,
	);

	return "rgb(" + r + ", " + g + ", " + b + ")";
};

const numberGradientVisualization = (
	factor: number,
	gradient: INumberGradient,
): ISDTFAttributeVisualizationData => {
	const steps = gradient.steps;
	const stepCount = steps.length;

	let stepFactor = 0;
	let colorBefore = steps[0].colorBefore;
	let colorAfter = steps[0].colorAfter;

	for (let i = 1; i < stepCount; i++) {
		if (factor <= steps[i].value) {
			colorBefore = steps[i - 1].colorBefore;
			colorAfter = steps[i].colorAfter;
			stepFactor =
				(factor - steps[i - 1].value) /
				(steps[i].value - steps[i - 1].value);
		}
	}

	return {
		material: new MaterialStandardData({
			color: interpolateColors(colorBefore, colorAfter, stepFactor),
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
	factor = Math.min(1, Math.max(0, factor));
	// check if the type is part of the enum
	if (typeof type === "string" && type in ATTRIBUTE_VISUALIZATION) {
		switch (type) {
			case ATTRIBUTE_VISUALIZATION.GRAYSCALE:
				return grayscaleVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.OPACITY:
				return opacityVisualization(
					factor,
					materialType,
					defaultMaterial,
				);
			case ATTRIBUTE_VISUALIZATION.BLUE_RED:
				return blueRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.BLUE_WHITE_RED:
				return blueWhiteRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.GREEN_RED:
				return greenRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED:
				return greenWhiteRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED:
				return blueGreenRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
				return blueGreenYellowRedPurpleWhiteVisualization(
					factor,
					materialType,
				);
			case ATTRIBUTE_VISUALIZATION.HSL:
				return hslVisualization(factor, materialType);
		}
	} else {
		if (isNumberGradient(type as IGradient)) {
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
	factor = Math.min(1, Math.max(0, factor));

	// check if the type is part of the enum
	if (typeof type === "string" && type in ATTRIBUTE_VISUALIZATION) {
		switch (type) {
			case ATTRIBUTE_VISUALIZATION.GRAYSCALE:
				return grayscaleVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.OPACITY:
				return opacityVisualization(
					factor,
					materialType,
					defaultMaterial,
				);
			case ATTRIBUTE_VISUALIZATION.BLUE_RED:
				return blueRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.BLUE_WHITE_RED:
				return blueWhiteRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.GREEN_RED:
				return greenRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED:
				return greenWhiteRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED:
				return blueGreenRedVisualization(factor, materialType);
			case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
				return blueGreenYellowRedPurpleWhiteVisualization(
					factor,
					materialType,
				);
			case ATTRIBUTE_VISUALIZATION.HSL:
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
