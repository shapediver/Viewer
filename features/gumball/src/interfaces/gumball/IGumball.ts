import {ITransformControlManager, Settings} from "../ITransformControlManager";

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

export type GumballSettings = {
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
} & Settings;

export type GumballSettingsOptional = Partial<GumballSettings>;
