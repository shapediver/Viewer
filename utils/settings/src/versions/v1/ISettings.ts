import {IGlobalSettings} from "../../interfaces/IGlobalSettings";

export interface ISettings extends IGlobalSettings {
	ambientOcclusion?: boolean;
	autoRotateSpeed?: number;
	backgroundColor?: string;
	bumpAmplitude?: number;
	camera?: {
		position?: {x?: number; y?: number; z?: number};
		target?: {x?: number; y?: number; z?: number};
	};
	cameraAutoAdjust?: boolean;
	cameraMovementDuration?: number;
	cameraOrtho?: {
		position?: {x?: number; y?: number; z?: number};
		target?: {x?: number; y?: number; z?: number};
	};
	cameraRevertAtMouseUp?: boolean;
	clearAlpha?: number;
	clearColor?: string;
	commitParameters?: boolean;
	controlDamping?: number;
	controlNames?: {};
	controlOrder?: string[];
	defaultMaterialColor?: string | number[];
	disablePan?: boolean;
	disableZoom?: boolean;
	enableAutoRotation?: boolean;
	enableRotation?: boolean;
	environmentMap?: string | string[];
	environmentMapResolution?: string;
	fov?: number;
	lightScene?: string;
	lightScenes?: any;
	panSpeed?: number;
	parametersHidden?: string[];
	pointSize?: number;
	revertAtMouseUpDuration?: number;
	rotateSpeed?: number;
	showEnvironmentMap?: boolean;
	showGrid?: boolean;
	showGroundPlane?: boolean;
	showShadows?: boolean;
	topView?: boolean;
	zoomExtentFactor?: number;
	zoomSpeed?: number;
}
