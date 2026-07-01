import {
	type ITransformationToolsManager,
	type Settings} from "../ITransformationToolsManager";

export interface IGumballTransform extends ITransformationToolsManager {}

export type GumballTransformSettings = {
	/**
	 * Enable or disable the rotation per axis.
	 */
	enableRotationAxes: {
		x?: boolean;
		y?: boolean;
		z?: boolean;
		xy?: boolean;
		yz?: boolean;
		xz?: boolean;
	};

	/**
	 * Enable or disable the scaling per axis.
	 */
	enableScalingAxes: {
		x?: boolean;
		y?: boolean;
		z?: boolean;
		xy?: boolean;
		yz?: boolean;
		xz?: boolean;
	};

	/**
	 * Enable or disable the translation per axis.
	 */
	enableTranslationAxes: {
		x?: boolean;
		y?: boolean;
		z?: boolean;
		xy?: boolean;
		yz?: boolean;
		xz?: boolean;
	};

	/**
	 * The space in which the Transformation Tools operates. (default: 'local')
	 */
	space: "local" | "world";

	/**
	 * The scale of the Transformation Tools compared to the screen size. (default: 0.15)
	 */
	scale: number;
} & Settings;

export type GumballTransformSettingsOptional = Partial<GumballTransformSettings>;
