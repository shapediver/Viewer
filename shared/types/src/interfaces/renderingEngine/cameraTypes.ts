import {vec2, vec3} from "gl-matrix";
import {IBox} from "../math/IBox";

export enum CAMERA_TYPE {
	PERSPECTIVE = "perspective",
	ORTHOGRAPHIC = "orthographic",
}

export enum ORTHOGRAPHIC_CAMERA_DIRECTION {
	TOP = "top",
	BOTTOM = "bottom",
	LEFT = "left",
	RIGHT = "right",
	FRONT = "front",
	BACK = "back",
	CUSTOM = "custom",
}

type CameraProperties = {
	readonly type: CAMERA_TYPE;
	autoAdjust: boolean;
	boundingBox: IBox;
	cameraMovementDuration: number;
	defaultPosition: vec3;
	defaultTarget: vec3;
	enableCameraControls: boolean;
	initialAutoAdjust: boolean;
	name?: string;
	order?: number;
	position: vec3;
	revertAtMouseUp: boolean;
	revertAtMouseUpDuration: number;
	sceneRotation: vec2;
	target: vec3;
	useNodeData: boolean;
	zoomExtentsFactor: number;
};

export type OrthographicCameraProperties = CameraProperties & {
	direction: ORTHOGRAPHIC_CAMERA_DIRECTION;
};
export type PerspectiveCameraProperties = CameraProperties & {
	fov: number;
};

export interface ICameraOptions {
	// #region Properties (4)

	/**
	 * The coordinate type of the camera interpolation. (default: 'cylindrical')
	 */
	coordinates?: "spherical" | "linear" | "cylindrical";
	/**
	 * The duration of the camera movement. (default: cameraMovementDuration set in the settings)
	 * When set to 0, the camera is immediately updated to the specified position and target.
	 */
	duration?: number;
	/**
	 * The easing type of the camera interpolation. (default: 'Quadratic.InOut')
	 */
	easing?:
		| "Linear.None"
		| "Quadratic.In"
		| "Quadratic.Out"
		| "Quadratic.InOut"
		| "Cubic.In"
		| "Cubic.Out"
		| "Cubic.InOut"
		| "Quartic.In"
		| "Quartic.Out"
		| "Quartic.InOut"
		| "Quintic.In"
		| "Quintic.Out"
		| "Quintic.InOut"
		| "Sinusoidal.In"
		| "Sinusoidal.Out"
		| "Sinusoidal.InOut"
		| "Exponential.In"
		| "Exponential.Out"
		| "Exponential.InOut"
		| "Circular.In"
		| "Circular.Out"
		| "Circular.InOut"
		| "Elastic.In"
		| "Elastic.Out"
		| "Elastic.InOut"
		| "Back.In"
		| "Back.Out"
		| "Back.InOut"
		| "Bounce.In"
		| "Bounce.Out"
		| "Bounce.InOut"
		| Function;
	/**
	 * The interpolation type of the camera interpolation. (default: 'CatmullRom')
	 */
	interpolation?: "Linear" | "Bezier" | "CatmullRom" | Function;

	// #endregion Properties (4)
}
