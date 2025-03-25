import {mat4, vec2, vec3} from "gl-matrix";
import {ICamera, ICameraOptions} from "../camera/ICamera";
import {ICameraControlsEventDistribution} from "./ICameraControlsEventDistribution";

// #region Type aliases (1)

export type Adjustments = {
	autoRotationSpeed: number;
	damping: number;
	movementSmoothness: number;
	panSpeed: number;
	rotationSpeed: number;
	zoomSpeed: number;
};

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface ICameraControls {
	// #region Properties (29)

	readonly cameraControlsEventDistribution: ICameraControlsEventDistribution;
	readonly canvas?: HTMLCanvasElement;

	autoRotationSpeed: number;
	camera: ICamera;
	cubePositionRestriction: {min: vec3; max: vec3};
	cubeTargetRestriction: {min: vec3; max: vec3};
	damping: number;
	enableAutoRotation: boolean;
	enableAzimuthRotation: boolean;
	enableKeyPan: boolean;
	enablePan: boolean;
	enablePolarRotation: boolean;
	enableRotation: boolean;
	enableTurntableControls: boolean;
	enableObjectControls: boolean;
	enableZoom: boolean;
	enabled: boolean;
	input: {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	};
	keyPanSpeed: number;
	movementSmoothness: number;
	panSpeed: number;
	position: vec3;
	rotationRestriction: {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	};
	rotationSpeed: number;
	spherePositionRestriction: {center: vec3; radius: number};
	sphereTargetRestriction: {center: vec3; radius: number};
	target: vec3;
	turntableCenter: vec3;
	objectControlsCenter: vec3;
	zoomRestriction: {minDistance: number; maxDistance: number};
	zoomSpeed: number;

	// #endregion Properties (29)

	// #region Public Methods (16)

	animate(
		path: {position: vec3; target: vec3}[],
		options: ICameraOptions,
	): Promise<boolean>;
	applyPositionMatrix(
		matrix: mat4,
		manualInteraction?: boolean | undefined,
	): void;
	applyPositionVector(
		vector: vec3,
		manualInteraction?: boolean | undefined,
	): void;
	applyRotation(vector: vec2, manualInteraction?: boolean | undefined): void;
	applyTargetMatrix(
		matrix: mat4,
		manualInteraction?: boolean | undefined,
	): void;
	applyTargetVector(
		vector: vec3,
		manualInteraction?: boolean | undefined,
	): void;
	applyUpMatrix(matrix: mat4, manualInteraction?: boolean | undefined): void;
	assignViewer(viewportId: string, canvas: HTMLCanvasElement): void;
	getPositionWithManualUpdates(): vec3;
	getPositionWithUpdates(): vec3;
	getTargetWithManualUpdates(): vec3;
	getTargetWithUpdates(): vec3;
	isMoving(): boolean;
	isWithinRestrictions(position: vec3, target: vec3): boolean;
	reset(): void;
	update(time: number): {position: vec3; target: vec3; sceneRotation: vec2};

	// #endregion Public Methods (16)
}

// #endregion Interfaces (1)
