import { vec3, vec2 } from "gl-matrix";
import { IPerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { IPerspectiveCameraApi } from "../../../interfaces/viewport/camera/IPerspectiveCameraApi";
import { AbstractCameraApi } from "./AbstractCameraApi";
import { InputValidator, Logger } from "@shapediver/viewer.shared.services";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";

export class PerspectiveCameraApi extends AbstractCameraApi implements IPerspectiveCameraApi {
    // #region Properties (1)

    readonly #camera: IPerspectiveCamera;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, camera: IPerspectiveCamera) {
        super(viewportApi, camera);
        this.#viewportApi = viewportApi;
        this.#camera = camera;
        this.scope = 'PerspectiveCameraApi';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (38)

    public get autoRotationSpeed(): number {
        return this.#camera.controls.autoRotationSpeed;
    }

    public set autoRotationSpeed(value: number) {
        const scope = 'autoRotationSpeed';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.autoRotationSpeed = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get cubePositionRestriction(): { min: vec3; max: vec3; } {
        return this.#camera.controls.cubePositionRestriction;
    }

    public set cubePositionRestriction(value: { min: vec3; max: vec3; }) {
        const scope = 'cubePositionRestriction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.min, 'vec3');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.max, 'vec3');
        this.#camera.controls.cubePositionRestriction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get cubeTargetRestriction(): { min: vec3; max: vec3; } {
        return this.#camera.controls.cubeTargetRestriction;
    }

    public set cubeTargetRestriction(value: { min: vec3; max: vec3; }) {
        const scope = 'cubeTargetRestriction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.min, 'vec3');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.max, 'vec3');
        this.#camera.controls.cubeTargetRestriction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get damping(): number {
        return this.#camera.controls.damping;
    }

    public set damping(value: number) {
        const scope = 'damping';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.damping = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get enableAutoRotation(): boolean {
        return this.#camera.controls.enableAutoRotation;
    }

    public set enableAutoRotation(value: boolean) {
        const scope = 'enableAutoRotation';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'boolean');
        this.#camera.controls.enableAutoRotation = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get enableKeyPan(): boolean {
        return this.#camera.controls.enableKeyPan;
    }

    public set enableKeyPan(value: boolean) {
        const scope = 'enableKeyPan';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'boolean');
        this.#camera.controls.enableKeyPan = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get enablePan(): boolean {
        return this.#camera.controls.enablePan;
    }

    public set enablePan(value: boolean) {
        const scope = 'enablePan';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'boolean');
        this.#camera.controls.enablePan = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get enableRotation(): boolean {
        return this.#camera.controls.enableRotation;
    }

    public set enableRotation(value: boolean) {
        const scope = 'enableRotation';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'boolean');
        this.#camera.controls.enableRotation = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get enableZoom(): boolean {
        return this.#camera.controls.enableZoom;
    }

    public set enableZoom(value: boolean) {
        const scope = 'enableZoom';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'boolean');
        this.#camera.controls.enableZoom = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get fov(): number {
        return this.#camera.fov;
    }

    public set fov(value: number) {
        const scope = 'fov';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.fov = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get keyPanSpeed(): number {
        return this.#camera.controls.keyPanSpeed;
    }

    public set keyPanSpeed(value: number) {
        const scope = 'keyPanSpeed';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.keyPanSpeed = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get movementSmoothness(): number {
        return this.#camera.controls.movementSmoothness;
    }

    public set movementSmoothness(value: number) {
        const scope = 'movementSmoothness';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.movementSmoothness = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get panSpeed(): number {
        return this.#camera.controls.panSpeed;
    }

    public set panSpeed(value: number) {
        const scope = 'panSpeed';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.panSpeed = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get rotationRestriction(): { minPolarAngle: number; maxPolarAngle: number; minAzimuthAngle: number; maxAzimuthAngle: number; } {
        return this.#camera.controls.rotationRestriction;
    }

    public set rotationRestriction(value: { minPolarAngle: number; maxPolarAngle: number; minAzimuthAngle: number; maxAzimuthAngle: number; }) {
        const scope = 'rotationRestriction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.minAzimuthAngle, 'number');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.maxAzimuthAngle, 'number');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.minPolarAngle, 'number');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.maxPolarAngle, 'number');
        this.#camera.controls.rotationRestriction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get rotationSpeed(): number {
        return this.#camera.controls.rotationSpeed;
    }

    public set rotationSpeed(value: number) {
        const scope = 'rotationSpeed';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.rotationSpeed = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get spherePositionRestriction(): { center: vec3; radius: number; } {
        return this.#camera.controls.spherePositionRestriction;
    }

    public set spherePositionRestriction(value: { center: vec3; radius: number; }) {
        const scope = 'spherePositionRestriction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.center, 'vec3');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.radius, 'number');
        this.#camera.controls.spherePositionRestriction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get sphereTargetRestriction(): { center: vec3; radius: number; } {
        return this.#camera.controls.sphereTargetRestriction;
    }

    public set sphereTargetRestriction(value: { center: vec3; radius: number; }) {
        const scope = 'sphereTargetRestriction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.center, 'vec3');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.radius, 'number');
        this.#camera.controls.sphereTargetRestriction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get zoomRestriction(): { minDistance: number; maxDistance: number; } {
        return this.#camera.controls.zoomRestriction;
    }

    public set zoomRestriction(value: { minDistance: number; maxDistance: number; }) {
        const scope = 'zoomRestriction';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.minDistance, 'number');
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value.maxDistance, 'number');
        this.#camera.controls.zoomRestriction = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    public get zoomSpeed(): number {
        return this.#camera.controls.zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        const scope = 'zoomSpeed';
        this.#inputValidator.validateAndError(`${this.scope}.${scope}`, value, 'number');
        this.#camera.controls.zoomSpeed = value;
        this.#logger.debug(`${this.scope}.${scope}: ${scope} was set to: ${value}`);
        this.#viewportApi.update();
    }

    // #endregion Public Accessors (38)
}