import { CAMERATYPE, ICamera, ICameraControls } from "@shapediver/viewer.rendering-engine.camera-engine";
import { container } from "tsyringe";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { Box } from "@shapediver/viewer.shared.math";
export abstract class Camera implements ICamera {
    // #region Properties (3)

    readonly #camera: ICamera;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: ICamera) {
        this.#camera = camera;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (22)

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
        this.#inputValidator.validate(value, 'boolean');
        this.#camera.autoAdjust = value;
        this.#logger.info(`Camera (${this.#camera.id}): autoAdjust was set to: ${value}`);
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
        this.#inputValidator.validate(value, 'positive');
        this.#camera.cameraMovementDuration = value;
        this.#logger.info(`Camera (${this.#camera.id}): cameraMovementDuration was set to: ${value}`);
    }

    /**
     * The defaultPosition of the camera
     * @return {vec3}
     */
    public get defaultPosition(): vec3 {
        return this.#camera.defaultPosition;
    }

    /**
     * The defaultPosition of the camera
     * @param {vec3} value
     */
    public set defaultPosition(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.defaultPosition = value;
        this.#logger.info(`Camera (${this.#camera.id}): defaultPosition was set to: ${value}`);
    }

    /**
     * The defaultTarget of the camera
     * @return {vec3}
     */
    public get defaultTarget(): vec3 {
        return this.#camera.defaultTarget;
    }

    /**
     * The defaultTarget of the camera
     * @param {vec3} value
     */
    public set defaultTarget(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.defaultTarget = value;
        this.#logger.info(`Camera (${this.#camera.id}): defaultTarget was set to: ${value}`);
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
        this.#inputValidator.validate(value, 'boolean');
        this.#camera.enableCameraControls = value;
        this.#logger.info(`Camera (${this.#camera.id}): enableCameraControls was set to: ${value}`);
    }

    /**
     * The id of the camera
     * @return {string}
     */
    public get id(): string {
        return this.#camera.id;
    }

    /**
     * The position of the camera
     * @return {vec3}
     */
    public get position(): vec3 {
        return this.#camera.position;
    }

    /**
     * The position of the camera
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.position = value;
        this.#logger.info(`Camera (${this.#camera.id}): position was set to: ${value}`);
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
        this.#inputValidator.validate(value, 'boolean');
        this.#camera.revertAtMouseUp = value;
        this.#logger.info(`Camera (${this.#camera.id}): revertAtMouseUp was set to: ${value}`);
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
        this.#inputValidator.validate(value, 'positive');
        this.#camera.revertAtMouseUpDuration = value;
        this.#logger.info(`Camera (${this.#camera.id}): revertAtMouseUpDuration was set to: ${value}`);
    }

    /**
     * The target of the camera
     * @return {vec3}
     */
    public get target(): vec3 {
        return this.#camera.target;
    }

    /**
     * The target of the camera
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.target = value;
        this.#logger.info(`Camera (${this.#camera.id}): target was set to: ${value}`);
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
        this.#inputValidator.validate(value, 'positive');
        this.#camera.zoomExtentsFactor = value;
        this.#logger.info(`Camera (${this.#camera.id}): zoomExtentsFactor was set to: ${value}`);
    }

    // #endregion Public Accessors (22)

    // #region Public Abstract Accessors (1)

    /**
     * The camera controls
     * @return {ICameraControls}
     */
    public abstract get controls(): ICameraControls;

    // #endregion Public Abstract Accessors (1)

    // #region Public Methods (4)

    public animate(path: { position: vec3; target: vec3; }[], options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        // TODO check, doc, etc
        return this.#camera.animate(path, options);
    }

    public reset(options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        // TODO check, doc, etc
        return this.#camera.reset(options);    
    }

    public set(position: vec3, target: vec3, options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        // TODO check, doc, etc
        return this.#camera.set(position, target, options);      
    }
    
    public zoomTo(zoomTarget: string[] | Box | null, options: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        // TODO check, doc, etc
        return this.#camera.zoomTo(zoomTarget, options);  
    }

    /**
     * Update the camera with the delta time of the viewer.
     * Normally, there shouldn't be much reason to use this function.
     * It is used internally in the rendering engine.
     * 
     * @param time the delta time
     * @returns 
     */
    public update(time: number): {
        position: vec3,
        target: vec3
    } {
        this.#inputValidator.validate(time, 'positive');
        return this.#camera.controls.update(time);
    }

    // #endregion Public Methods (4)
}