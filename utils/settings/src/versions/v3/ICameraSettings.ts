export interface IOrbitControlsSettings {
	autoRotationSpeed: number;
	damping: number;
	enableAutoRotation: boolean;
	enableKeyPan: boolean;
	enablePan: boolean;
	enableRotation: boolean;
	enableZoom: boolean;
	input: {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	};
	keyPanSpeed: number;
	movementSmoothness: number;
	restrictions: {
		position: {
			cube: {
				min: {x: number; y: number; z: number};
				max: {x: number; y: number; z: number};
			};
			sphere: {center: {x: number; y: number; z: number}; radius: number};
		};
		target: {
			cube: {
				min: {x: number; y: number; z: number};
				max: {x: number; y: number; z: number};
			};
			sphere: {center: {x: number; y: number; z: number}; radius: number};
		};
		rotation: {
			minPolarAngle: number;
			maxPolarAngle: number;
			minAzimuthAngle: number;
			maxAzimuthAngle: number;
		};
		zoom: {minDistance: number; maxDistance: number};
	};
	rotationSpeed: number;
	panSpeed: number;
	zoomSpeed: number;
}

export interface IOrthographicControlsSettings {
	damping: number;
	enableKeyPan: boolean;
	enablePan: boolean;
	enableZoom: boolean;
	input: {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	};
	keyPanSpeed: number;
	movementSmoothness: number;
	panSpeed: number;
	zoomSpeed: number;
}

interface IGeneralCameraSettings {
	name?: string;
	type: string;
}
export interface IOrthographicCameraSettings extends IGeneralCameraSettings {
	autoAdjust: boolean;
	cameraMovementDuration: number;
	controls: IOrthographicControlsSettings;
	enableCameraControls: boolean;
	position: {x: number; y: number; z: number};
	revertAtMouseUp: boolean;
	revertAtMouseUpDuration: number;
	target: {x: number; y: number; z: number};
	zoomExtentsFactor: number;
}
export interface IPerspectiveCameraSettings extends IGeneralCameraSettings {
	autoAdjust: boolean;
	cameraMovementDuration: number;
	controls: IOrbitControlsSettings;
	enableCameraControls: boolean;
	fov: number;
	position: {x: number; y: number; z: number};
	revertAtMouseUp: boolean;
	revertAtMouseUpDuration: number;
	target: {x: number; y: number; z: number};
	zoomExtentsFactor: number;
}
export interface ICameraSettings {
	[key: string]: IOrthographicCameraSettings | IPerspectiveCameraSettings;
}
