import {IDomEventListener} from "@shapediver/viewer";

// #region Type aliases (2)

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
	 * The scale of the Gumball compared to the screen size. (default: 0.15)
	 */
	scale: number;
	/**
	 * The space in which the Gumball operates. (default: 'local')
	 */
	space: "local" | "world";
	/**
	 * Reuse the transformation that are already applied to the nodes. (default: true)
	 */
	reuseTransformation: boolean;
};
export type SettingsOptional = Partial<Settings>;

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IGumball extends IDomEventListener {
	// #region Properties (15)

	/**
	 * Reuse the transformation that are already applied to the nodes.
	 */
	readonly reuseTransformation: boolean;
	/**
	 * The scale of the Gumball compared to the screen size.
	 */
	readonly space: "local" | "world";

	/**
	 * Enable or disable rotation.
	 */
	enableRotation: boolean;
	/**
	 * Enable or disable the rotation on the x-axis.
	 */
	enableRotationX: boolean;
	/**
	 * Enable or disable the rotation on the y-axis.
	 */
	enableRotationY: boolean;
	/**
	 * Enable or disable the rotation on the z-axis.
	 */
	enableRotationZ: boolean;
	/**
	 * Enable or disable the rotation on the xy-plane.
	 */
	enableRotationXY: boolean;
	/**
	 * Enable or disable the rotation on the yz-plane.
	 */
	enableRotationYZ: boolean;
	/**
	 * Enable or disable the rotation on the xz-plane.
	 */
	enableRotationXZ: boolean;
	/**
	 * Enable or disable scaling
	 */
	enableScaling: boolean;
	/**
	 * Enable or disable the scaling on the x-axis.
	 */
	enableScalingX: boolean;
	/**
	 * Enable or disable the scaling on the y-axis.
	 */
	enableScalingY: boolean;
	/**
	 * Enable or disable the scaling on the z-axis.
	 */
	enableScalingZ: boolean;
	/**
	 * Enable or disable the scaling on the xy-plane.
	 */
	enableScalingXY: boolean;
	/**
	 * Enable or disable the scaling on the yz-plane.
	 */
	enableScalingYZ: boolean;
	/**
	 * Enable or disable the scaling on the xz-plane.
	 */
	enableScalingXZ: boolean;
	/**
	 * Enable or disable translation
	 */
	enableTranslation: boolean;
	/**
	 * Enable or disable the translation on the x-axis.
	 */
	enableTranslationX: boolean;
	/**
	 * Enable or disable the translation on the y-axis.
	 */
	enableTranslationY: boolean;
	/**
	 * Enable or disable the translation on the z-axis.
	 */
	enableTranslationZ: boolean;
	/**
	 * Enable or disable the translation on the xy-plane.
	 */
	enableTranslationXY: boolean;
	/**
	 * Enable or disable the translation on the yz-plane.
	 */
	enableTranslationYZ: boolean;
	/**
	 * Enable or disable the translation on the xz-plane.
	 */
	enableTranslationXZ: boolean;
	/**
	 * Show or hide the Gumball.
	 */
	show: boolean;

	// #endregion Properties (15)

	// #region Public Methods (1)

	close(): void;

	// #endregion Public Methods (1)
}

// #endregion Interfaces (1)
