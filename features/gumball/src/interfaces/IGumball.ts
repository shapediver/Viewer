import {RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";

import {ITransformControlManager} from "./ITransformControlManager";

export interface IGumball extends ITransformControlManager {
	/**
	 * Enable or disable rotation.
	 */
	enableRotation: boolean;

	/**
	 * Enable or disable the rotation on the x-axis.
	 */
	enableRotationX: boolean;

	/**
	 * Enable or disable the rotation on the xy-plane.
	 */
	enableRotationXY: boolean;

	/**
	 * Enable or disable the rotation on the xz-plane.
	 */
	enableRotationXZ: boolean;

	/**
	 * Enable or disable the rotation on the y-axis.
	 */
	enableRotationY: boolean;

	/**
	 * Enable or disable the rotation on the yz-plane.
	 */
	enableRotationYZ: boolean;

	/**
	 * Enable or disable the rotation on the z-axis.
	 */
	enableRotationZ: boolean;

	/**
	 * Enable or disable scaling
	 */
	enableScaling: boolean;

	/**
	 * Enable or disable the scaling on the x-axis.
	 */
	enableScalingX: boolean;

	/**
	 * Enable or disable the scaling on the xy-plane.
	 */
	enableScalingXY: boolean;

	/**
	 * Enable or disable the scaling on the xz-plane.
	 */
	enableScalingXZ: boolean;

	/**
	 * Enable or disable the scaling on the y-axis.
	 */
	enableScalingY: boolean;

	/**
	 * Enable or disable the scaling on the yz-plane.
	 */
	enableScalingYZ: boolean;

	/**
	 * Enable or disable the scaling on the z-axis.
	 */
	enableScalingZ: boolean;

	/**
	 * Enable or disable translation
	 */
	enableTranslation: boolean;

	/**
	 * Enable or disable the translation on the x-axis.
	 */
	enableTranslationX: boolean;

	/**
	 * Enable or disable the translation on the xy-plane.
	 */
	enableTranslationXY: boolean;

	/**
	 * Enable or disable the translation on the xz-plane.
	 */
	enableTranslationXZ: boolean;

	/**
	 * Enable or disable the translation on the y-axis.
	 */
	enableTranslationY: boolean;

	/**
	 * Enable or disable the translation on the yz-plane.
	 */
	enableTranslationYZ: boolean;

	/**
	 * Enable or disable the translation on the z-axis.
	 */
	enableTranslationZ: boolean;
}

export type Settings = {
	/**
	 * Enable or disable rotation. (default: true)
	 */
	enableRotation: boolean;

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
	 * Enable or disable scaling. (default: true)
	 */
	enableScaling: boolean;

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
	 * Enable or disable translation. (default: true)
	 */
	enableTranslation: boolean;

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
	 * Restrictions that are applied to the transformation. (default: {})
	 * The key of the restriction is used to identify the restriction and can be used to update or remove the restriction later on.
	 * The value is the properties of the restriction. The type of the restriction is determined by the "type" property of the restriction properties.
	 */
	restrictions: Partial<{[key: string]: RestrictionProperties}>;

	/**
	 * Reuse the transformation that are already applied to the nodes. (default: true)
	 */
	reuseTransformation: boolean;

	/**
	 * The scale of the Gumball compared to the screen size. (default: 0.15)
	 */
	scale: number;

	/**
	 * The space in which the Gumball operates. (default: 'local')
	 */
	space: "local" | "world";
};

export type SettingsOptional = Partial<Settings>;
