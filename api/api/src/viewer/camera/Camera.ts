import { AbstractCamera, CAMERATYPE, ICamera, ICameraControls } from "@shapediver/viewer.rendering-engine.camera-engine";
import { container } from "tsyringe";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { Box } from "@shapediver/viewer.shared.math";
export abstract class Camera implements ICamera {
    // #region Properties (15)

    readonly #camera: ICamera;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    readonly autoAdjust!: boolean;
    readonly cameraMovementDuration!: number;
    readonly defaultPosition!: vec3;
    readonly defaultTarget!: vec3;
    readonly enableCameraControls!: boolean;
    readonly id!: string;
    readonly position!: vec3;
    readonly revertAtMouseUp!: boolean;
    readonly revertAtMouseUpDuration!: number;
    readonly target!: vec3;
    readonly type!: CAMERATYPE;
    readonly zoomExtentsFactor!: number;

    readonly #updateCB = () => {
        (<any>this.autoAdjust) = this.#camera.autoAdjust;
        (<any>this.cameraMovementDuration) = this.#camera.cameraMovementDuration;
        (<any>this.defaultPosition) = this.#camera.defaultPosition;
        (<any>this.defaultTarget) = this.#camera.defaultTarget;
        (<any>this.enableCameraControls) = this.#camera.enableCameraControls;
        (<any>this.id) = this.#camera.id;
        (<any>this.position) = this.#camera.position;
        (<any>this.revertAtMouseUp) = this.#camera.revertAtMouseUp;
        (<any>this.revertAtMouseUpDuration) = this.#camera.revertAtMouseUpDuration;
        (<any>this.target) = this.#camera.target;
        (<any>this.type) = this.#camera.type;
        (<any>this.zoomExtentsFactor) = this.#camera.zoomExtentsFactor;
    }

    // #endregion Properties (15)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: ICamera) {
        this.#camera = camera;
        (<AbstractCamera>this.#camera).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    /**
     * Default duration of camera movements
     * @param {number} value
     */
    public updateCameraMovementDuration(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#camera.cameraMovementDuration = value;
        this.#logger.info(`Camera (${this.#camera.id}): cameraMovementDuration was set to: ${value}`);
    }

    /**
     * The defaultPosition of the camera
     * @param {vec3} value
     */
    public updateDefaultPosition(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.defaultPosition = value;
        this.#logger.info(`Camera (${this.#camera.id}): defaultPosition was set to: ${value}`);
    }

    /**
     * The defaultTarget of the camera
     * @param {vec3} value
     */
    public updateDefaultTarget(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.defaultTarget = value;
        this.#logger.info(`Camera (${this.#camera.id}): defaultTarget was set to: ${value}`);
    }

    /**
     * Enable / Disable the camera controls
     * @param {boolean} value
     */
    public updateEnableCameraControls(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#camera.enableCameraControls = value;
        this.#logger.info(`Camera (${this.#camera.id}): enableCameraControls was set to: ${value}`);
    }

    /**
     * The position of the camera
     * @param {vec3} value
     */
    public updatePosition(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.position = value;
        this.#logger.info(`Camera (${this.#camera.id}): position was set to: ${value}`);
    }

    /**
     * Enable / Disable if the mouse should reset on mouse up
     * @param {boolean} value
     */
    public updateRevertAtMouseUp(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#camera.revertAtMouseUp = value;
        this.#logger.info(`Camera (${this.#camera.id}): revertAtMouseUp was set to: ${value}`);
    }

    /**
     * The duration of the transition of the revertAtMouseUp
     * @param {number} value
     */
    public updateRevertAtMouseUpDuration(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#camera.revertAtMouseUpDuration = value;
        this.#logger.info(`Camera (${this.#camera.id}): revertAtMouseUpDuration was set to: ${value}`);
    }

    /**
     * The target of the camera
     * @param {vec3} value
     */
    public updateTarget(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#camera.target = value;
        this.#logger.info(`Camera (${this.#camera.id}): target was set to: ${value}`);
    }

    /**
     * Factor to apply to the bounding box before zooming to extents
     * @param {number} value
     */
    public updateZoomExtentsFactor(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#camera.zoomExtentsFactor = value;
        this.#logger.info(`Camera (${this.#camera.id}): zoomExtentsFactor was set to: ${value}`);
    }

    // #endregion Public Accessors (9)

    // #region Public Methods (5)

    /**
     * Let the camera follow a path from different position and target pairs to another.
     * 
     * @param path the defined path
     * @param options various options to be adjusted
     * @returns 
     */
    public animate(path: { position: vec3; target: vec3; }[], options?: { easing?: string; duration?: number; default?: boolean; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        for(let i = 0; i < path.length; i++) {
            this.#inputValidator.validate(path[i].position, 'vec3');
            this.#inputValidator.validate(path[i].target, 'vec3');
        }
        this.#inputValidator.validate(options, 'object');
        if(options) this.#inputValidator.validate(options.easing, 'string', false);
        if(options) this.#inputValidator.validate(options.duration, 'number', false);
        if(options) this.#inputValidator.validate(options.default, 'boolean', false);
        if(options) this.#inputValidator.validate(options.coordinates, 'string', false);
        if(options) this.#inputValidator.validate(options.interpolation, 'string', false);
        this.#logger.info(`Camera ${this.id}: Starting camera path animation.`);
        return this.#camera.animate(path, options);
    }

    /**
     * Reset the camera to its default position and target.
     * 
     * @param options various options to be adjusted
     * @returns 
     */
    public reset(options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        this.#inputValidator.validate(options, 'object');
        if(options) this.#inputValidator.validate(options.easing, 'string', false);
        if(options) this.#inputValidator.validate(options.duration, 'number', false);
        if(options) this.#inputValidator.validate(options.coordinates, 'string', false);
        if(options) this.#inputValidator.validate(options.interpolation, 'string', false);
        this.#logger.info(`Camera ${this.id}: Resetting position and target.`);
        return this.#camera.reset(options);    
    }

    /**
     * Set the camera to its a specific position and target.
     * 
     * @param options various options to be adjusted
     * @returns 
     */
    public set(position: vec3, target: vec3, options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        this.#inputValidator.validate(position, 'vec3');
        this.#inputValidator.validate(target, 'vec3');
        this.#inputValidator.validate(options, 'object');
        if(options) this.#inputValidator.validate(options.easing, 'string', false);
        if(options) this.#inputValidator.validate(options.duration, 'number', false);
        if(options) this.#inputValidator.validate(options.coordinates, 'string', false);
        if(options) this.#inputValidator.validate(options.interpolation, 'string', false);
        this.#logger.info(`Camera ${this.id}: Setting position to ${position} and target to ${target}.`);
        return this.#camera.set(vec3.fromValues(position[0], position[1], position[2]), vec3.fromValues(target[0], target[1], target[2]), options);      
    }

    /**
     * Enable / Disable that the camera adjusts to geometry updates
     * @param {boolean} value
     */
    public updateAutoAdjust(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#camera.autoAdjust = value;
        this.#logger.info(`Camera (${this.#camera.id}): autoAdjust was set to: ${value}`);
    }

    /**
     * Zoom in on a specific part of the scene, or the whole scene (default).
     * 
     * @param zoomTarget the target to zoom to
     * @param options various options to be adjusted
     * @returns 
     */
    public zoomTo(zoomTarget?: string[] | Box, options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        if(zoomTarget) {
            if(Array.isArray(zoomTarget)) {
                 this.#inputValidator.validate(zoomTarget, 'stringArray');
            } else if(!(zoomTarget instanceof Box)) {
                this.#logger.error(`Camera ${this.id}: The specified zoom target does not have a valid type`);
                return Promise.resolve(false);
            }
        }
        if(options) this.#inputValidator.validate(options.easing, 'string', false);
        if(options) this.#inputValidator.validate(options.duration, 'number', false);
        if(options) this.#inputValidator.validate(options.coordinates, 'string', false);
        if(options) this.#inputValidator.validate(options.interpolation, 'string', false);
        this.#logger.info(`Camera ${this.id}: Zooming in.`);
        return this.#camera.zoomTo(zoomTarget, options);  
    }

    // #endregion Public Methods (5)
}