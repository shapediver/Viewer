import { CAMERATYPE, ICamera, ICameraControls, ICameraDefinition } from "@shapediver/viewer.rendering-engine.camera-engine";
export abstract class Camera implements ICamera {

    readonly #camera: ICamera;

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: ICamera) {
        this.#camera = camera;
    }

    /**
     * Enable / Disable that the camera adjusts to geometry updates
     * @return {boolean}
     */
     public get autoAdjust(): boolean {
        return this.#camera.autoAdjust;
    }

    /**
     * Enable / Disable that the camera adjusts to geometry updates
     * @param {boolean} value
     */
    public set autoAdjust(value: boolean) {
        this.#camera.autoAdjust = value;
    }

    /**
     * The definition (position and target) of the camera
     * @return {ICameraDefinition}
     */
    public get cameraDefinition(): ICameraDefinition {
        return this.#camera.cameraDefinition;
    }

    /**
     * The definition (position and target) of the camera
     * @param {ICameraDefinition} value
     */
    public set cameraDefinition(value: ICameraDefinition) {
        this.#camera.cameraDefinition = value;
    }

    /**
     * Default duration of camera movements
     * @return {number}
     */
    public get cameraMovementDuration(): number {
        return this.#camera.cameraMovementDuration;
    }

    /**
     * Default duration of camera movements
     * @param {number} value
     */
    public set cameraMovementDuration(value: number) {
        this.#camera.cameraMovementDuration = value;
    }

    /**
     * The camera controls
     * @return {ICameraControls}
     */
    public abstract get controls(): ICameraControls;

    /**
     * The default definition (position and target) of the camera
     * @return {ICameraDefinition}
     */
    public get default(): ICameraDefinition {
        return this.#camera.default;
    }

    /**
     * The default definition (position and target) of the camera
     * @param {ICameraDefinition} value
     */
    public set default(value: ICameraDefinition) {
        this.#camera.default = value;
    }

    /**
     * Enable / Disable the camera controls
     * @return {boolean}
     */
    public get enableCameraControls(): boolean {
        return this.#camera.enableCameraControls;
    }

    /**
     * Enable / Disable the camera controls
     * @param {boolean} value
     */
    public set enableCameraControls(value: boolean) {
        this.#camera.enableCameraControls = value;
    }

    /**
     * Enable / Disable if the mouse should reset on mouse up
     * @return {boolean}
     */
    public get revertAtMouseUp(): boolean {
        return this.#camera.revertAtMouseUp;
    }

    /**
     * Enable / Disable if the mouse should reset on mouse up
     * @param {boolean} value
     */
    public set revertAtMouseUp(value: boolean) {
        this.#camera.revertAtMouseUp = value;
    }

    /**
     * The duration of the transition of the revertAtMouseUp
     * @return {number}
     */
    public get revertAtMouseUpDuration(): number {
        return this.#camera.revertAtMouseUpDuration;
    }

    /**
     * The duration of the transition of the revertAtMouseUp
     * @param {number} value
     */
    public set revertAtMouseUpDuration(value: number) {
        this.#camera.revertAtMouseUpDuration = value;
    }

    /**
     * The type of the camera
     * @return {CAMERATYPE}
     */
    public get type(): CAMERATYPE {
        return this.#camera.type;
    }

    /**
     * Factor to apply to the bounding box before zooming to extents
     * @return {number}
     */
    public get zoomExtentsFactor(): number {
        return this.#camera.zoomExtentsFactor;
    }

    /**
     * Factor to apply to the bounding box before zooming to extents
     * @param {number} value
     */
    public set zoomExtentsFactor(value: number) {
        this.#camera.zoomExtentsFactor = value;
    }

    /**
     * The id of the camera
     * @return {string}
     */
    public get id(): string {
        return this.#camera.id;
    }

    // #endregion Public Accessors (20)

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
        return this.#camera.controls.update(time);
    }
    
}