import {
	CAMERA_TYPE,
	type ICamera,
	type ICameraOptions} from "@shapediver/viewer.rendering-engine.camera-engine";
import {Box, type IBox} from "@shapediver/viewer.shared.math";
import {
	InputValidator,
	Logger,
	ShapeDiverViewerValidationError} from "@shapediver/viewer.shared.services";

import {vec2, vec3} from "gl-matrix";

import {type ICameraApi} from "../../interfaces/camera/ICameraApi";
import {type IViewportApi} from "../../interfaces/IViewportApi";

export abstract class AbstractCameraApi implements ICameraApi {
	readonly #camera: ICamera;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #viewportApi: IViewportApi;

	protected scope: string = "AbstractCameraApi";

	constructor(viewportApi: IViewportApi, camera: ICamera) {
		this.#viewportApi = viewportApi;
		this.#camera = camera;
	}

	public get autoAdjust(): boolean {
		return this.#camera.autoAdjust;
	}

	public set autoAdjust(value: boolean) {
		const scope = "autoAdjust";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.autoAdjust = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get autoRotationSpeed(): number {
		return this.#camera.controls.autoRotationSpeed;
	}

	public set autoRotationSpeed(value: number) {
		const scope = "autoRotationSpeed";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.autoRotationSpeed = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get cameraMovementDuration(): number {
		return this.#camera.cameraMovementDuration;
	}

	public set cameraMovementDuration(value: number) {
		const scope = "cameraMovementDuration";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.cameraMovementDuration = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get cubePositionRestriction(): {min: vec3; max: vec3} {
		return this.#camera.controls.cubePositionRestriction;
	}

	public set cubePositionRestriction(value: {min: vec3; max: vec3}) {
		const scope = "cubePositionRestriction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.min,
			"vec3",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.max,
			"vec3",
		);
		this.#camera.controls.cubePositionRestriction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get cubeTargetRestriction(): {min: vec3; max: vec3} {
		return this.#camera.controls.cubeTargetRestriction;
	}

	public set cubeTargetRestriction(value: {min: vec3; max: vec3}) {
		const scope = "cubeTargetRestriction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.min,
			"vec3",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.max,
			"vec3",
		);
		this.#camera.controls.cubeTargetRestriction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get damping(): number {
		return this.#camera.controls.damping;
	}

	public set damping(value: number) {
		const scope = "damping";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.damping = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get defaultPosition(): vec3 {
		return this.#camera.defaultPosition;
	}

	public set defaultPosition(value: vec3) {
		const scope = "defaultPosition";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"vec3",
		);
		this.#camera.defaultPosition = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get defaultTarget(): vec3 {
		return this.#camera.defaultTarget;
	}

	public set defaultTarget(value: vec3) {
		const scope = "defaultTarget";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"vec3",
		);
		this.#camera.defaultTarget = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableAutoRotation(): boolean {
		return this.#camera.controls.enableAutoRotation;
	}

	public set enableAutoRotation(value: boolean) {
		const scope = "enableAutoRotation";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableAutoRotation = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableAzimuthRotation(): boolean {
		return this.#camera.controls.enableAzimuthRotation;
	}

	public set enableAzimuthRotation(value: boolean) {
		const scope = "enableAzimuthRotation";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableAzimuthRotation = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableKeyPan(): boolean {
		return this.#camera.controls.enableKeyPan;
	}

	public set enableKeyPan(value: boolean) {
		const scope = "enableKeyPan";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableKeyPan = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableObjectControls(): boolean {
		return this.#camera.controls.enableObjectControls;
	}

	public set enableObjectControls(value: boolean) {
		const scope = "enableObjectControls";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableObjectControls = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enablePan(): boolean {
		return this.#camera.controls.enablePan;
	}

	public set enablePan(value: boolean) {
		const scope = "enablePan";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enablePan = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enablePolarRotation(): boolean {
		return this.#camera.controls.enablePolarRotation;
	}

	public set enablePolarRotation(value: boolean) {
		const scope = "enablePolarRotation";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enablePolarRotation = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableRotation(): boolean {
		return this.#camera.controls.enableRotation;
	}

	public set enableRotation(value: boolean) {
		const scope = "enableRotation";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableRotation = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableTurntableControls(): boolean {
		return this.#camera.controls.enableTurntableControls;
	}

	public set enableTurntableControls(value: boolean) {
		const scope = "enableTurntableControls";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableTurntableControls = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enableZoom(): boolean {
		return this.#camera.controls.enableZoom;
	}

	public set enableZoom(value: boolean) {
		const scope = "enableZoom";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enableZoom = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get enabled(): boolean {
		return this.#camera.controls.enabled;
	}

	public set enabled(value: boolean) {
		const scope = "enabled";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.controls.enabled = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get id(): string {
		return this.#camera.id;
	}

	public get initialAutoAdjust(): boolean {
		return this.#camera.initialAutoAdjust;
	}

	public set initialAutoAdjust(value: boolean) {
		const scope = "initialAutoAdjust";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.initialAutoAdjust = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get isDefault(): boolean {
		return this.#camera.isDefault;
	}

	public get keyPanSpeed(): number {
		return this.#camera.controls.keyPanSpeed;
	}

	public set keyPanSpeed(value: number) {
		const scope = "keyPanSpeed";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.keyPanSpeed = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get movementSmoothness(): number {
		return this.#camera.controls.movementSmoothness;
	}

	public set movementSmoothness(value: number) {
		const scope = "movementSmoothness";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.movementSmoothness = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get name(): string | undefined {
		return this.#camera.name;
	}

	public set name(value: string | undefined) {
		const scope = "name";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"string",
			false,
		);
		this.#camera.name = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get objectControlsCenter(): vec3 {
		return this.#camera.controls.objectControlsCenter;
	}

	public set objectControlsCenter(value: vec3) {
		const scope = "objectControlsCenter";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"vec3",
		);
		this.#camera.controls.objectControlsCenter = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get order(): number | undefined {
		return this.#camera.order;
	}

	public set order(value: number | undefined) {
		const scope = "order";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
			false,
		);
		this.#camera.order = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get panSpeed(): number {
		return this.#camera.controls.panSpeed;
	}

	public set panSpeed(value: number) {
		const scope = "panSpeed";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.panSpeed = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get position(): vec3 {
		return this.#camera.position;
	}

	public set position(value: vec3) {
		const scope = "position";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"vec3",
		);
		this.#camera.position = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get revertAtMouseUp(): boolean {
		return this.#camera.revertAtMouseUp;
	}

	public set revertAtMouseUp(value: boolean) {
		const scope = "revertAtMouseUp";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"boolean",
		);
		this.#camera.revertAtMouseUp = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get revertAtMouseUpDuration(): number {
		return this.#camera.revertAtMouseUpDuration;
	}

	public set revertAtMouseUpDuration(value: number) {
		const scope = "revertAtMouseUpDuration";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.revertAtMouseUpDuration = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get rotationRestriction(): {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	} {
		return this.#camera.controls.rotationRestriction;
	}

	public set rotationRestriction(value: {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	}) {
		const scope = "rotationRestriction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.minAzimuthAngle,
			"number",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.maxAzimuthAngle,
			"number",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.minPolarAngle,
			"number",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.maxPolarAngle,
			"number",
		);
		this.#camera.controls.rotationRestriction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get rotationSpeed(): number {
		return this.#camera.controls.rotationSpeed;
	}

	public set rotationSpeed(value: number) {
		const scope = "rotationSpeed";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.rotationSpeed = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get spherePositionRestriction(): {center: vec3; radius: number} {
		return this.#camera.controls.spherePositionRestriction;
	}

	public set spherePositionRestriction(value: {
		center: vec3;
		radius: number;
	}) {
		const scope = "spherePositionRestriction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.center,
			"vec3",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.radius,
			"number",
		);
		this.#camera.controls.spherePositionRestriction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get sphereTargetRestriction(): {center: vec3; radius: number} {
		return this.#camera.controls.sphereTargetRestriction;
	}

	public set sphereTargetRestriction(value: {center: vec3; radius: number}) {
		const scope = "sphereTargetRestriction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.center,
			"vec3",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.radius,
			"number",
		);
		this.#camera.controls.sphereTargetRestriction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get target(): vec3 {
		return this.#camera.target;
	}

	public set target(value: vec3) {
		const scope = "target";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"vec3",
		);
		this.#camera.target = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get turntableCenter(): vec3 {
		return this.#camera.controls.turntableCenter;
	}

	public set turntableCenter(value: vec3) {
		const scope = "turntableCenter";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"vec3",
		);
		this.#camera.controls.turntableCenter = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get type(): CAMERA_TYPE {
		return this.#camera.type;
	}

	public get zoomRestriction(): {minDistance: number; maxDistance: number} {
		return this.#camera.controls.zoomRestriction;
	}

	public set zoomRestriction(value: {
		minDistance: number;
		maxDistance: number;
	}) {
		const scope = "zoomRestriction";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.minDistance,
			"number",
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value.maxDistance,
			"number",
		);
		this.#camera.controls.zoomRestriction = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get zoomSpeed(): number {
		return this.#camera.controls.zoomSpeed;
	}

	public set zoomSpeed(value: number) {
		const scope = "zoomSpeed";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.controls.zoomSpeed = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public get zoomToFactor(): number {
		return this.#camera.zoomExtentsFactor;
	}

	public set zoomToFactor(value: number) {
		const scope = "zoomToFactor";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			value,
			"number",
		);
		this.#camera.zoomExtentsFactor = value;
		this.#logger.debug(
			`${this.scope}.${scope}: ${scope} was set to: ${value}`,
		);
		this.#viewportApi.update();
	}

	public animate(
		path: {position: vec3; target: vec3}[],
		options?: ICameraOptions,
	): Promise<boolean> {
		const scope = "animate";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			path,
			"array",
		);
		for (let i = 0; i < path.length; i++) {
			this.#inputValidator.validateAndError(
				`${this.scope}.${scope}`,
				path[i].position,
				"vec3",
			);
			this.#inputValidator.validateAndError(
				`${this.scope}.${scope}`,
				path[i].target,
				"vec3",
			);
		}
		this.#validateOptions(scope, options);

		return this.#camera.animate(path, options);
	}

	public calculateZoomTo(
		zoomTarget?: IBox,
		startingPosition?: vec3,
		startingTarget?: vec3,
	): {position: vec3; target: vec3} {
		const scope = "calculateZoomTo";
		if (zoomTarget !== undefined && !(zoomTarget instanceof Box))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${zoomTarget} is not of type Box.`,
				zoomTarget,
				"Box",
			);

		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			startingPosition,
			"vec3",
			false,
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			startingTarget,
			"vec3",
			false,
		);

		return this.#camera.calculateZoomTo(
			zoomTarget,
			startingPosition,
			startingTarget,
		);
	}

	public project(p: vec3): vec2 {
		const scope = "project";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			p,
			"vec3",
		);
		return this.#camera.project(p);
	}

	public reset(options?: ICameraOptions): Promise<boolean> {
		const scope = "reset";
		this.#validateOptions(scope, options);
		return this.#camera.reset(options);
	}

	public set(
		position: vec3,
		target: vec3,
		options?: ICameraOptions,
	): Promise<boolean> {
		const scope = "set";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			position,
			"vec3",
			false,
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			target,
			"vec3",
			false,
		);
		this.#validateOptions(scope, options);
		return this.#camera.set(position, target, options);
	}

	public unproject(p: vec3): vec3 {
		const scope = "unproject";
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			p,
			"vec3",
			false,
		);
		return this.#camera.unproject(p);
	}

	public zoomTo(
		zoomTarget?: IBox,
		options?: ICameraOptions,
	): Promise<boolean> {
		const scope = "zoomTo";
		if (zoomTarget !== undefined && !(zoomTarget instanceof Box))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${zoomTarget} is not of type Box.`,
				zoomTarget,
				"Box",
			);

		this.#validateOptions(scope, options);
		return this.#camera.zoomTo(zoomTarget, options);
	}

	readonly #validateOptions = (scope: string, options?: ICameraOptions) => {
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			options,
			"object",
			false,
		);
		const prop = Object.assign({}, options);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			prop.easing,
			"string",
			false,
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			prop.duration,
			"number",
			false,
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			prop.coordinates,
			"string",
			false,
		);
		this.#inputValidator.validateAndError(
			`${this.scope}.${scope}`,
			prop.interpolation,
			"string",
			false,
		);
	};
}
