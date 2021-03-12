import { ICameraControls, ICameraDefinition, OrthographicCameraControls as OrthographicCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { vec3 } from "gl-matrix";

export class OrthographicCameraControls implements ICameraControls {
    // #region Properties (1)

    readonly #controls: OrthographicCameraControlsLogic;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(controls: OrthographicCameraControlsLogic) {
        this.#controls = controls;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (44)

    /**
     * Getter damping
     * @return {number}
     */
    public get damping(): number {
        return this.#controls.damping;
    }

    /**
     * Setter damping
     * @param {number} value
     */
    public set damping(value: number) {
        this.#controls.damping = value;
    }

    /**
     * Getter enableKeyPan
     * @return {boolean}
     */
    public get enableKeyPan(): boolean {
        return this.#controls.enableKeyPan;
    }

    /**
     * Setter enableKeyPan
     * @param {boolean} value
     */
    public set enableKeyPan(value: boolean) {
        this.#controls.enableKeyPan = value;
    }

    /**
     * Getter enablePan
     * @return {boolean}
     */
    public get enablePan(): boolean {
        return this.#controls.enablePan;
    }

    /**
     * Setter enablePan
     * @param {boolean} value
     */
    public set enablePan(value: boolean) {
        this.#controls.enablePan = value;
    }

    /**
     * Getter enableZoom
     * @return {boolean}
     */
    public get enableZoom(): boolean {
        return this.#controls.enableZoom;
    }

    /**
     * Setter enableZoom
     * @param {boolean} value
     */
    public set enableZoom(value: boolean) {
        this.#controls.enableZoom = value;
    }

    /**
     * Getter enabled
     * @return {boolean}
     */
    public get enabled(): boolean {
        return this.#controls.enabled;
    }

    /**
     * Setter enabled
     * @param {boolean} value
     */
    public set enabled(value: boolean) {
        this.#controls.enabled = value;
    }

    /**
     * Getter input
     * @return {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }}
     */
    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this.#controls.input;
    }

    /**
     * Setter input
     * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
     */
    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        this.#controls.input = value;
    }

    /**
     * Getter keyPanSpeed
     * @return {number}
     */
    public get keyPanSpeed(): number {
        return this.#controls.keyPanSpeed;
    }

    /**
     * Setter keyPanSpeed
     * @param {number} value
     */
    public set keyPanSpeed(value: number) {
        this.#controls.keyPanSpeed = value;
    }

    /**
     * Getter movementSmoothness
     * @return {number}
     */
    public get movementSmoothness(): number {
        return this.#controls.movementSmoothness;
    }

    /**
     * Setter movementSmoothness
     * @param {number} value
     */
    public set movementSmoothness(value: number) {
        this.#controls.movementSmoothness = value;
    }

    /**
     * Getter panSpeed
     * @return {number}
     */
    public get panSpeed(): number {
        return this.#controls.panSpeed;
    }

    /**
     * Setter panSpeed
     * @param {number} value
     */
    public set panSpeed(value: number) {
        this.#controls.panSpeed = value;
    }

    /**
     * Getter position
     * @return {vec3}
     */
    public get position(): vec3 {
        return this.#controls.position;
    }

    /**
     * Setter position
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this.#controls.position = value;
    }

    /**
     * Getter target
     * @return {vec3}
     */
    public get target(): vec3 {
        return this.#controls.target;
    }

    /**
     * Setter target
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this.#controls.target = value;
    }

    /**
     * Getter zoomSpeed
     * @return {number}
     */
    public get zoomSpeed(): number {
        return this.#controls.zoomSpeed;
    }

    /**
     * Setter zoomSpeed
     * @param {number} value
     */
    public set zoomSpeed(value: number) {
        this.#controls.zoomSpeed = value;
    }

    // #endregion Public Accessors (44)

    // #region Public Methods (1)

    public update(time: number): ICameraDefinition {
        return this.#controls.update(time);
    }

    // #endregion Public Methods (1)
}