// #region Interfaces (5)

export interface ICameraControlsSettings {
	// #region Properties (20)

	autoRotationSpeed: number;
	damping: number;
	enableAutoRotation: boolean;
	enableAzimuthRotation: boolean;
	enableKeyPan: boolean;
	enableObjectControls: boolean;
	enablePan: boolean;
	enablePolarRotation: boolean;
	enableRotation: boolean;
	enableTurntableControls: boolean;
	enableZoom: boolean;
	input: {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	};
	keyPanSpeed: number;
	movementSmoothness: number;
	objectControlsCenter: {x: number; y: number; z: number};
	panSpeed: number;
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
	turntableCenter: {x: number; y: number; z: number};
	zoomSpeed: number;

	// #endregion Properties (20)
}

export interface ICameraSettings {
	// #region Public Indexers (1)

	[key: string]: IOrthographicCameraSettings | IPerspectiveCameraSettings;

	// #endregion Public Indexers (1)
}

interface IGeneralCameraSettings {
	// #region Properties (12)

	autoAdjust: boolean;
	cameraMovementDuration: number;
	controls: ICameraControlsSettings;
	enableCameraControls: boolean;
	name?: string;
	position: {x: number; y: number; z: number};
	revertAtMouseUp: boolean;
	revertAtMouseUpDuration: number;
	sceneRotation: {x: number; y: number};
	target: {x: number; y: number; z: number};
	type: string;
	zoomExtentsFactor: number;

	// #endregion Properties (12)
}

export interface IOrthographicCameraSettings extends IGeneralCameraSettings {}

export interface IPerspectiveCameraSettings extends IGeneralCameraSettings {
	// #region Properties (1)

	fov: number;

	// #endregion Properties (1)
}

// #endregion Interfaces (5)
