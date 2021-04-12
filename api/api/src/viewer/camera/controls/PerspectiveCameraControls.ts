import { ICameraControls, PerspectiveCameraControls as PerspectiveCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export class PerspectiveCameraControls implements ICameraControls {
    // #region Properties (1)

    readonly #controls: PerspectiveCameraControlsLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param controls 
     */
    constructor(controls: PerspectiveCameraControlsLogic) {
        this.#controls = controls;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (44)

    /**
     * Speed of autorotation, can be negative, also refer to enableAutoRotation
     * @return {number}
     */
    public get autoRotationSpeed(): number {
        return this.#controls.autoRotationSpeed;
    }

    /**
     * Speed of autorotation, can be negative, also refer to enableAutoRotation
     * @param {number} value
     */
    public set autoRotationSpeed(value: number) {
        this.#inputValidator.validate(value, 'number');
        this.#controls.autoRotationSpeed = value;
        this.#logger.info(`Camera Controls: autoRotationSpeed was set to: ${value}`);
    }

    /**
     * Restriction of the camera position inside a cube, minimum and maximum corner of the cube
     * @return {{ min: vec3, max: vec3 }}
     */
    public get cubePositionRestriction(): { min: vec3, max: vec3 } {
        return this.#controls.cubePositionRestriction;
    }

    /**
     * Restriction of the camera position inside a cube, minimum and maximum corner of the cube
     * @param {{ min: vec3, max: vec3 }} value
     */
    public set cubePositionRestriction(value: { min: vec3, max: vec3 }) {
        this.#inputValidator.validate(value.min, 'vec3');
        this.#inputValidator.validate(value.max, 'vec3');
        this.#controls.cubePositionRestriction = value;
        this.#logger.info(`Camera Controls: cubePositionRestriction was set to: ${value}`);
    }

    /**
     * Restriction of the camera target inside a cube, minimum and maximum corner of the cube
     * @return {{ min: vec3, max: vec3 }}
     */
    public get cubeTargetRestriction(): { min: vec3, max: vec3 } {
        return this.#controls.cubeTargetRestriction;
    }

    /**
     * Restriction of the camera target inside a cube, minimum and maximum corner of the cube
     * @param {{ min: vec3, max: vec3 }} value
     */
    public set cubeTargetRestriction(value: { min: vec3, max: vec3 }) {
        this.#inputValidator.validate(value.min, 'vec3');
        this.#inputValidator.validate(value.max, 'vec3');
        this.#controls.cubeTargetRestriction = value;
        this.#logger.info(`Camera Controls: cubeTargetRestriction was set to: ${value}`);
    }

    /**
     * The damping of the camera movement
     * @return {number}
     */
    public get damping(): number {
        return this.#controls.damping;
    }

    /**
     * The damping of the camera movement
     * @param {number} value
     */
    public set damping(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#controls.damping = value;
        this.#logger.info(`Camera Controls: damping was set to: ${value}`);
    }

    /**
     * Enable / Disable automatic rotation of the camera, also refer to autoRotationSpeed
     * @return {boolean}
     */
    public get enableAutoRotation(): boolean {
        return this.#controls.enableAutoRotation;
    }

    /**
     * Enable / Disable automatic rotation of the camera, also refer to autoRotationSpeed
     * @param {boolean} value
     */
    public set enableAutoRotation(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableAutoRotation = value;
        this.#logger.info(`Camera Controls: enableAutoRotation was set to: ${value}`);
    }

    /**
     * Enable / Disable panning using the keyboard, also refer to enablePan
     * @return {boolean}
     */
    public get enableKeyPan(): boolean {
        return this.#controls.enableKeyPan;
    }

    /**
     * Enable / Disable panning using the keyboard, also refer to enablePan
     * @param {boolean} value
     */
    public set enableKeyPan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableKeyPan = value;
        this.#logger.info(`Camera Controls: enableKeyPan was set to: ${value}`);
    }

    /**
     * Enable / Disable panning in general, also refer to enableKeyPan
     * @return {boolean}
     */
    public get enablePan(): boolean {
        return this.#controls.enablePan;
    }

    /**
     * Enable / Disable panning in general, also refer to enableKeyPan
     * @param {boolean} value
     */
    public set enablePan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enablePan = value;
        this.#logger.info(`Camera Controls: enablePan was set to: ${value}`);
    }

    /**
     * Enable / Disable camera rotation
     * @return {boolean}
     */
    public get enableRotation(): boolean {
        return this.#controls.enableRotation;
    }

    /**
     * Enable / Disable camera rotation
     * @param {boolean} value
     */
    public set enableRotation(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableRotation = value;
        this.#logger.info(`Camera Controls: enableRotation was set to: ${value}`);
    }

    /**
     * Enable / Disable zooming
     * @return {boolean}
     */
    public get enableZoom(): boolean {
        return this.#controls.enableZoom;
    }

    /**
     * Enable / Disable zooming
     * @param {boolean} value
     */
    public set enableZoom(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableZoom = value;
        this.#logger.info(`Camera Controls: enableZoom was set to: ${value}`);
    }

    /**
     * Enable / Disable the camera controls
     * @return {boolean}
     */
    public get enabled(): boolean {
        return this.#controls.enabled;
    }

    /**
     * Enable / Disable the camera controls
     * @param {boolean} value
     */
    public set enabled(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enabled = value;
        this.#logger.info(`Camera Controls: enabled was set to: ${value}`);
    }

    /**
     * The input definition
     * @return {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }}
     */
    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this.#controls.input;
    }

    /**
     * The input definition
     * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
     */
    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        this.#inputValidator.validate(value.keys.down, 'number');
        this.#inputValidator.validate(value.keys.left, 'number');
        this.#inputValidator.validate(value.keys.right, 'number');
        this.#inputValidator.validate(value.keys.up, 'number');        
        this.#inputValidator.validate(value.mouse.pan, 'number');
        this.#inputValidator.validate(value.mouse.rotate, 'number');
        this.#inputValidator.validate(value.mouse.zoom, 'number');
        this.#inputValidator.validate(value.touch.pan, 'number');
        this.#inputValidator.validate(value.touch.rotate, 'number');
        this.#inputValidator.validate(value.touch.zoom, 'number');
        this.#controls.input = value;
        this.#logger.info(`Camera Controls: input was set to: ${value}`);
    }

    /**
     * Speed of panning when using the keyboard
     * @return {number}
     */
    public get keyPanSpeed(): number {
        return this.#controls.keyPanSpeed;
    }

    /**
     * Speed of panning when using the keyboard
     * @param {number} value
     */
    public set keyPanSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.keyPanSpeed = value;
        this.#logger.info(`Camera Controls: keyPanSpeed was set to: ${value}`);
    }

    /**
     * The effect the previous movement has on the next one
     * @return {number}
     */
    public get movementSmoothness(): number {
        return this.#controls.movementSmoothness;
    }

    /**
     * The effect the previous movement has on the next one
     * @param {number} value
     */
    public set movementSmoothness(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.movementSmoothness = value;
        this.#logger.info(`Camera Controls: movementSmoothness was set to: ${value}`);
    }

    /**
     * Speed of panning
     * @return {number}
     */
    public get panSpeed(): number {
        return this.#controls.panSpeed;
    }

    /**
     * Speed of panning
     * @param {number} value
     */
    public set panSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.panSpeed = value;
        this.#logger.info(`Camera Controls: panSpeed was set to: ${value}`);
    }

    /**
     * Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree
     * @return {{ minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }}
     */
    public get rotationRestriction(): { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number } {
        return this.#controls.rotationRestriction;
    }

    /**
     * Minimum and maximum polar and azimuth angle of the camera position with respect to the camera target, unit degree
     * @param {{ minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }} value
     */
    public set rotationRestriction(value: { minPolarAngle: number, maxPolarAngle: number, minAzimuthAngle: number, maxAzimuthAngle: number }) {
        this.#inputValidator.validate(value.minPolarAngle, 'number');
        this.#inputValidator.validate(value.maxPolarAngle, 'number');
        this.#inputValidator.validate(value.minAzimuthAngle, 'number');
        this.#inputValidator.validate(value.maxAzimuthAngle, 'number');
        this.#controls.rotationRestriction = value;
        this.#logger.info(`Camera Controls: rotationRestriction was set to: ${value}`);
    }

    /**
     * Speed of camera rotation
     * @return {number}
     */
    public get rotationSpeed(): number {
        return this.#controls.rotationSpeed;
    }

    /**
     * Speed of camera rotation
     * @param {number} value
     */
    public set rotationSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.rotationSpeed = value;
        this.#logger.info(`Camera Controls: rotationSpeed was set to: ${value}`);
    }

    /**
     * Restriction of the camera position inside a sphere, center and radius of the sphere
     * @return {{ center: vec3, radius: number }}
     */
    public get spherePositionRestriction(): { center: vec3, radius: number } {
        return this.#controls.spherePositionRestriction;
    }

    /**
     * Restriction of the camera position inside a sphere, center and radius of the sphere
     * @param {{ center: vec3, radius: number }} value
     */
    public set spherePositionRestriction(value: { center: vec3, radius: number }) {
        this.#inputValidator.validate(value.center, 'vec3');
        this.#inputValidator.validate(value.radius, 'positive');
        this.#controls.spherePositionRestriction = value;
        this.#logger.info(`Camera Controls: spherePositionRestriction was set to: ${value}`);
    }

    /**
     * Restriction of the camera target inside a sphere, center and radius of the sphere
     * @return {{ center: vec3, radius: number }}
     */
    public get sphereTargetRestriction(): { center: vec3, radius: number } {
        return this.#controls.sphereTargetRestriction;
    }

    /**
     * Restriction of the camera target inside a sphere, center and radius of the sphere
     * @param {{ center: vec3, radius: number }} value
     */
    public set sphereTargetRestriction(value: { center: vec3, radius: number }) {
        this.#inputValidator.validate(value.center, 'vec3');
        this.#inputValidator.validate(value.radius, 'positive');
        this.#controls.sphereTargetRestriction = value;
        this.#logger.info(`Camera Controls: sphereTargetRestriction was set to: ${value}`);
    }

    /**
     * Minimum and maximum distance between camera position and target
     * @return {{ minDistance: number, maxDistance: number }}
     */
    public get zoomRestriction(): { minDistance: number, maxDistance: number } {
        return this.#controls.zoomRestriction;
    }

    /**
     * Minimum and maximum distance between camera position and target
     * @param {{ minDistance: number, maxDistance: number }} value
     */
    public set zoomRestriction(value: { minDistance: number, maxDistance: number }) {
        this.#inputValidator.validate(value.minDistance, 'number');
        this.#inputValidator.validate(value.maxDistance, 'number');
        this.#controls.zoomRestriction = value;
        this.#logger.info(`Camera Controls: zoomRestriction was set to: ${value}`);
    }

    /**
     * Speed of zooming
     * @return {number}
     */
    public get zoomSpeed(): number {
        return this.#controls.zoomSpeed;
    }

    /**
     * Speed of zooming
     * @param {number} value
     */
    public set zoomSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.zoomSpeed = value;
        this.#logger.info(`Camera Controls: zoomSpeed was set to: ${value}`);
    }

    // #endregion Public Accessors (44)

    // #region Public Methods (1)

    /**
     * Update the camera with the delta time of the viewer.
     * Normally, there shouldn't be much reason to use this function.
     * It is used internally in the rendering engine.
     * 
     * @param time the delta time
     * @returns 
     */
    public update(time: number): { position: vec3, target: vec3 } {
        this.#inputValidator.validate(time, 'positive');
        return this.#controls.update(time);
    }

    // #endregion Public Methods (1)
}