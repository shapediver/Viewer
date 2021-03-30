import { ICameraControls, ICameraDefinition, OrthographicCameraControls as OrthographicCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export class OrthographicCameraControls implements ICameraControls {
    // #region Properties (1)

    readonly #controls: OrthographicCameraControlsLogic;
    readonly #inputValidator = <InputValidator>container.resolve(InputValidator);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param controls 
     */
    constructor(controls: OrthographicCameraControlsLogic) {
        this.#controls = controls;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (44)

    /**
     * The daming of the camera movement
     * @return {number}
     */
    public get damping(): number {
        return this.#controls.damping;
    }

    /**
     * The daming of the camera movement
     * @param {number} value
     */
    public set damping(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#controls.damping = value;
    }

    /**
     * Enable / disable panning using the keyboard, also refer to enablePan
     * @return {boolean}
     */
    public get enableKeyPan(): boolean {
        return this.#controls.enableKeyPan;
    }

    /**
     * Enable / disable panning using the keyboard, also refer to enablePan
     * @param {boolean} value
     */
    public set enableKeyPan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableKeyPan = value;
    }

    /**
     * Enable / disable panning in general, also refer to enableKeyPan
     * @return {boolean}
     */
    public get enablePan(): boolean {
        return this.#controls.enablePan;
    }

    /**
     * Enable / disable panning in general, also refer to enableKeyPan
     * @param {boolean} value
     */
    public set enablePan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enablePan = value;
    }

    /**
     * Enable / disable zooming
     * @return {boolean}
     */
    public get enableZoom(): boolean {
        return this.#controls.enableZoom;
    }

    /**
     * Enable / disable zooming
     * @param {boolean} value
     */
    public set enableZoom(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
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
        this.#inputValidator.validate(value, 'boolean');
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
        this.#inputValidator.validate(value, 'vec3');
        this.#controls.position = value;
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
        this.#inputValidator.validate(value, 'vec3');
        this.#controls.target = value;
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
        this.#inputValidator.validate(time, 'positive');
        return this.#controls.update(time);
    }

    // #endregion Public Methods (1)
}