import { ICameraControls, ICameraDefinition, PerspectiveCameraControls as PerspectiveCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { vec3 } from "gl-matrix";

export class PerspectiveCameraControls implements ICameraControls {
    // #region Properties (1)

    readonly #controls: PerspectiveCameraControlsLogic;

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
        this.#controls.autoRotationSpeed = value;
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
        this.#controls.cubePositionRestriction = value;
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
        this.#controls.cubeTargetRestriction = value;
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
        this.#controls.damping = value;
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
        this.#controls.enableAutoRotation = value;
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
        this.#controls.enableKeyPan = value;
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
        this.#controls.enablePan = value;
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
        this.#controls.enableRotation = value;
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
        this.#controls.enableZoom = value;
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
        this.#controls.enabled = value;
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
        this.#controls.input = value;
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
        this.#controls.keyPanSpeed = value;
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
        this.#controls.movementSmoothness = value;
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
        this.#controls.panSpeed = value;
    }

    /**
     * The position of the camera
     * @return {vec3}
     */
    public get position(): vec3 {
        return this.#controls.position;
    }

    /**
     * The position of the camera
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this.#controls.position = value;
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
        this.#controls.rotationRestriction = value;
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
        this.#controls.rotationSpeed = value;
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
        this.#controls.spherePositionRestriction = value;
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
        this.#controls.sphereTargetRestriction = value;
    }

    /**
     * The target of the camera
     * @return {vec3}
     */
    public get target(): vec3 {
        return this.#controls.target;
    }

    /**
     * The target of the camera
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this.#controls.target = value;
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
        this.#controls.zoomRestriction = value;
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
        this.#controls.zoomSpeed = value;
    }

    // #endregion Public Accessors (44)

    // #region Public Methods (1)

    /**
     * Update the camera with the delta time of the viewer.
     * Normally, there should't be much reason to use this function.
     * It is used internally in the rendering engine.
     * 
     * @param time the delta time
     * @returns 
     */
    public update(time: number): ICameraDefinition {
        return this.#controls.update(time);
    }

    // #endregion Public Methods (1)
}