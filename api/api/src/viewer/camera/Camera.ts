import { CAMERATYPE, ICamera, ICameraControls, ICameraDefinition } from "@shapediver/viewer.rendering-engine.camera-engine";
export abstract class Camera implements ICamera {

    readonly #camera: ICamera;

    constructor(camera: ICamera) {
        this.#camera = camera;
    }

    /**
     * Getter autoAdjust
     * @return {boolean}
     */
     public get autoAdjust(): boolean {
        return this.#camera.autoAdjust;
    }

    /**
     * Setter autoAdjust
     * @param {boolean} value
     */
    public set autoAdjust(value: boolean) {
        this.#camera.autoAdjust = value;
    }

    /**
     * Getter cameraDefinition
     * @return {ICameraDefinition}
     */
    public get cameraDefinition(): ICameraDefinition {
        return this.#camera.cameraDefinition;
    }

    /**
     * Setter cameraDefinition
     * @param {ICameraDefinition} value
     */
    public set cameraDefinition(value: ICameraDefinition) {
        this.#camera.cameraDefinition = value;
    }

    /**
     * Getter cameraMovementDuration
     * @return {number}
     */
    public get cameraMovementDuration(): number {
        return this.#camera.cameraMovementDuration;
    }

    /**
     * Setter cameraMovementDuration
     * @param {number} value
     */
    public set cameraMovementDuration(value: number) {
        this.#camera.cameraMovementDuration = value;
    }

    /**
     * Getter controls
     * @return {ICameraControls}
     */
    public abstract get controls(): ICameraControls;

    /**
     * Getter default
     * @return {ICameraDefinition}
     */
    public get default(): ICameraDefinition {
        return this.#camera.default;
    }

    /**
     * Setter default
     * @param {ICameraDefinition} value
     */
    public set default(value: ICameraDefinition) {
        this.#camera.default = value;
    }

    /**
     * Getter enableCameraControls
     * @return {boolean}
     */
    public get enableCameraControls(): boolean {
        return this.#camera.enableCameraControls;
    }

    /**
     * Setter enableCameraControls
     * @param {boolean} value
     */
    public set enableCameraControls(value: boolean) {
        this.#camera.enableCameraControls = value;
    }

    /**
     * Getter revertAtMouseUp
     * @return {boolean}
     */
    public get revertAtMouseUp(): boolean {
        return this.#camera.revertAtMouseUp;
    }

    /**
     * Setter revertAtMouseUp
     * @param {boolean} value
     */
    public set revertAtMouseUp(value: boolean) {
        this.#camera.revertAtMouseUp = value;
    }

    /**
     * Getter revertAtMouseUpDuration
     * @return {number}
     */
    public get revertAtMouseUpDuration(): number {
        return this.#camera.revertAtMouseUpDuration;
    }

    /**
     * Setter revertAtMouseUpDuration
     * @param {number} value
     */
    public set revertAtMouseUpDuration(value: number) {
        this.#camera.revertAtMouseUpDuration = value;
    }

    /**
     * Getter type
     * @return {CAMERATYPE}
     */
    public get type(): CAMERATYPE {
        return this.#camera.type;
    }

    /**
     * Getter zoomExtentsFactor
     * @return {number}
     */
    public get zoomExtentsFactor(): number {
        return this.#camera.zoomExtentsFactor;
    }

    /**
     * Setter zoomExtentsFactor
     * @param {number} value
     */
    public set zoomExtentsFactor(value: number) {
        this.#camera.zoomExtentsFactor = value;
    }

    /**
       * Getter id
       * @return {string}
       */
    public get id(): string {
        return this.#camera.id;
    }

    // #endregion Public Accessors (20)

    // #region Public Methods (1)

    public update(time: number): ICameraDefinition {
        return this.#camera.controls.update(time);
    }
    
}