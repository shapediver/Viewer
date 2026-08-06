import {vec2, vec3} from "gl-matrix";
import {type IBox} from "../math/IBox";

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

export type CameraProperties = {
	readonly type: CAMERA_TYPE;
	autoAdjust: boolean;
	autoRotationSpeed: number;
	boundingBox: IBox;
	cubePositionRestriction: {min: vec3; max: vec3};
	cubeTargetRestriction: {min: vec3; max: vec3};
	damping: number;
	cameraMovementDuration: number;
	defaultPosition: vec3;
	defaultTarget: vec3;
	enableCameraControls: boolean;
	enableAutoRotation: boolean;
	enableAzimuthRotation: boolean;
	enableKeyPan: boolean;
	enableObjectControls: boolean;
	enablePan: boolean;
	enablePolarRotation: boolean;
	enableRotation: boolean;
	enableTurntableControls: boolean;
	enableZoom: boolean;
	enabled: boolean;
	initialAutoAdjust: boolean;
	keyPanSpeed: number;
	movementSmoothness: number;
	name?: string;
	objectControlsCenter: vec3;
	order?: number;
	panSpeed: number;
	position: vec3;
	revertAtMouseUp: boolean;
	revertAtMouseUpDuration: number;
	rotationRestriction: {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	};
	rotationSpeed: number;
	sceneRotation: vec2;
	spherePositionRestriction: {center: vec3; radius: number};
	sphereTargetRestriction: {center: vec3; radius: number};
	target: vec3;
	turntableCenter: vec3;
	useNodeData: boolean;
	zoomRestriction: {minDistance: number; maxDistance: number};
	zoomSpeed: number;
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
