import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
interface IAmbientLightProperties {
	color: string | number;
	intensity: number;
}

interface IDirectionalLightProperties {
	color: string | number;
	intensity: number;
	direction: {x: number; y: number; z: number};
	castShadow: boolean;
	shadowMapResolution: number;
	shadowMapBias: number;
}

interface IHemisphereLightProperties {
	skyColor: string | number;
	intensity: number;
	groundColor: string | number;
}

interface IPointLightProperties {
	color: string | number;
	intensity: number;
	position: {x: number; y: number; z: number};
	distance: number;
	decay: number;
}

interface ISpotLightProperties {
	color: string | number;
	intensity: number;
	position: {x: number; y: number; z: number};
	target: {x: number; y: number; z: number};
	distance: number;
	decay: number;
	angle: number;
	penumbra: number;
}

interface ILightSceneSettings {
	[key: string]: {
		id: string;
		name?: string;
		lights: {
			[key: string]: {
				id: string;
				name?: string;
				type: string;
				order?: number;
				properties:
					| IAmbientLightProperties
					| IDirectionalLightProperties
					| IHemisphereLightProperties
					| IPointLightProperties
					| ISpotLightProperties;
			};
		};
	};
}
export interface ISettings extends IGlobalSettings {
	ar?: {
		enableCameraSync: boolean;
		enableCameraSyncInitial: boolean;
		enableLightingEstimation: boolean;
		enableTouchControls: boolean;
		enableTouchControlRotation: boolean;
		enableAutomaticPlacement: boolean;
		defaultHitTestType: string;
	};
	defaultMaterial: {
		bumpAmplitude: number;
		color: string | number[];
		metalness: number;
		roughness: number;
	};
	parameters?: {
		controlOrder?: string[];
		controlNames?: {[key: string]: string};
		parametersHidden?: string[];
	};
	viewer: {
		blurSceneWhenBusy: boolean;
		ignoreSuperseded: boolean;
		loggingLevel: number;
		messageLoggingLevel: number;

		viewerRuntimeId: string;
		hasRestoredSettings: boolean;
		useModelSettings: boolean;
		showMessages?: boolean;

		commitSettings: boolean;
		commitParameters: boolean;

		scene: {
			show: boolean;
			showSceneTransition: string;
			duration: number;
			fullscreen: boolean;
			gridVisibility: boolean;
			groundPlaneReflectionThreshold: number;
			groundPlaneReflectionVisibility: boolean;
			groundPlaneVisibility: boolean;

			camera: {
				autoAdjust: boolean;
				cameraMovementDuration: number;
				cameraTypes: {
					perspective: {
						default: {
							position: {x: number; y: number; z: number};
							target: {x: number; y: number; z: number};
						};
						fov: number;
						controls: number;
					};
					orthographic: {
						default: {
							position: {x: number; y: number; z: number};
							target: {x: number; y: number; z: number};
						};
					};
					active: number;
				};
				controls: {
					orbit: {
						autoRotationSpeed: number;
						damping: number;
						enableAutoRotation: boolean;
						enableKeyPan: boolean;
						enablePan: boolean;
						enableRotation: boolean;
						enableZoom: boolean;
						input: {
							keys: {
								up: number;
								down: number;
								left: number;
								right: number;
							};
							mouse: {rotate: number; zoom: number; pan: number};
							touch: {rotate: number; zoom: number; pan: number};
						};
						keyPanSpeed: number;
						movementSmoothness: number;
						restrictions: {
							position?: {
								cube?: {
									min: {x: number; y: number; z: number};
									max: {x: number; y: number; z: number};
								};
								sphere?: {
									center: {x: number; y: number; z: number};
									radius: number;
								};
							};
							target?: {
								cube?: {
									min: {x: number; y: number; z: number};
									max: {x: number; y: number; z: number};
								};
								sphere?: {
									center: {x: number; y: number; z: number};
									radius: number;
								};
							};
							rotation?: {
								minPolarAngle: number;
								maxPolarAngle: number;
								minAzimuthAngle: number;
								maxAzimuthAngle: number;
							};
							zoom?: {minDistance: number; maxDistance: number};
						};
						rotationSpeed: number;
						panSpeed: number;
						zoomSpeed: number;
					};
					fps: {};
					orthographic: {
						damping: number;
						enableKeyPan: boolean;
						enablePan: boolean;
						enableZoom: boolean;
						input: {
							keys: {
								up: number;
								down: number;
								left: number;
								right: number;
							};
							mouse: {rotate: number; zoom: number; pan: number};
							touch: {rotate: number; zoom: number; pan: number};
						};
						keyPanSpeed: number;
						movementSmoothness: number;
						panSpeed: number;
						zoomSpeed: number;
					};
				};
				enableCameraControls: boolean;
				revertAtMouseUp: boolean;
				revertAtMouseUpDuration: number;
				zoomExtentsFactor: number;
			};
			lights: {
				helper: boolean;
				lightScene: string;
				lightScenes: ILightSceneSettings;
			};
			material: {
				environmentMap: string | string[];
				environmentMapAsBackground: boolean;
				environmentMapResolution: string;
			};
			render: {
				ambientOcclusion: boolean;
				beautyRenderDelay: number;
				beautyRenderBlendingDuration?: number;
				clearAlpha: number;
				clearColor: string;
				pointSize: number;
				shadows: boolean;
				sao: {
					samples: number;
					kernelRadius: number;
					intensity: number;
					standardDev: number;
				};
			};
		};
	};
}
