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
        this.#logger.debugLow(`Camera(${this.id}).constructor: Camera api created.`);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (9)

    /**
     * Default duration of camera movements
     * @param {number} value
     */
    public updateCameraMovementDuration(value: number) {
        this.#logger.debugLow(`Camera(${this.id}).updateCameraMovementDuration: Updating CameraMovementDuration to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateCameraMovementDuration`, value, 'positive');
        this.#camera.cameraMovementDuration = value;
        this.#logger.info(`Camera(${this.id}).updateCameraMovementDuration: cameraMovementDuration was set to: ${value}`);
    }

    /**
     * The defaultPosition of the camera
     * @param {vec3} value
     */
    public updateDefaultPosition(value: vec3) {
        this.#logger.debugLow(`Camera(${this.id}).updateDefaultPosition: Updating DefaultPosition to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateDefaultPosition`, value, 'vec3');
        this.#camera.defaultPosition = value;
        this.#logger.info(`Camera(${this.id}).updateDefaultPosition: defaultPosition was set to: ${value}`);
    }

    /**
     * The defaultTarget of the camera
     * @param {vec3} value
     */
    public updateDefaultTarget(value: vec3) {
        this.#logger.debugLow(`Camera(${this.id}).updateDefaultTarget: Updating DefaultTarget to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateDefaultTarget`, value, 'vec3');
        this.#camera.defaultTarget = value;
        this.#logger.info(`Camera(${this.id}).updateDefaultTarget: defaultTarget was set to: ${value}`);
    }

    /**
     * Enable / Disable the camera controls
     * @param {boolean} value
     */
    public updateEnableCameraControls(value: boolean) {
        this.#logger.debugLow(`Camera(${this.id}).updateEnableCameraControls: Updating EnableCameraControls to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateEnableCameraControls`, value, 'boolean');
        this.#camera.enableCameraControls = value;
        this.#logger.info(`Camera(${this.id}).updateEnableCameraControls: enableCameraControls was set to: ${value}`);
    }

    /**
     * The position of the camera
     * @param {vec3} value
     */
    public updatePosition(value: vec3) {
        this.#logger.debugLow(`Camera(${this.id}).updatePosition: Updating Position to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updatePosition`, value, 'vec3');
        this.#camera.position = value;
        this.#logger.info(`Camera(${this.id}).updatePosition: position was set to: ${value}`);
    }

    /**
     * Enable / Disable if the mouse should reset on mouse up
     * @param {boolean} value
     */
    public updateRevertAtMouseUp(value: boolean) {
        this.#logger.debugLow(`Camera(${this.id}).updateRevertAtMouseUp: Updating RevertAtMouseUp to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateRevertAtMouseUp`, value, 'boolean');
        this.#camera.revertAtMouseUp = value;
        this.#logger.info(`Camera(${this.id}).updateRevertAtMouseUp: revertAtMouseUp was set to: ${value}`);
    }

    /**
     * The duration of the transition of the revertAtMouseUp
     * @param {number} value
     */
    public updateRevertAtMouseUpDuration(value: number) {
        this.#logger.debugLow(`Camera(${this.id}).updateRevertAtMouseUpDuration: Updating RevertAtMouseUpDuration to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateRevertAtMouseUpDuration`, value, 'positive');
        this.#camera.revertAtMouseUpDuration = value;
        this.#logger.info(`Camera(${this.id}).updateRevertAtMouseUpDuration: revertAtMouseUpDuration was set to: ${value}`);
    }

    /**
     * The target of the camera
     * @param {vec3} value
     */
    public updateTarget(value: vec3) {
        this.#logger.debugLow(`Camera(${this.id}).updateTarget: Updating Target to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateTarget`, value, 'vec3');
        this.#camera.target = value;
        this.#logger.info(`Camera(${this.id}).updateTarget: target was set to: ${value}`);
    }

    /**
     * Factor to apply to the bounding box before zooming to extents
     * @param {number} value
     */
    public updateZoomExtentsFactor(value: number) {
        this.#logger.debugLow(`Camera(${this.id}).updateZoomExtentsFactor: Updating ZoomExtentsFactor to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateZoomExtentsFactor`, value, 'positive');
        this.#camera.zoomExtentsFactor = value;
        this.#logger.info(`Camera(${this.id}).updateZoomExtentsFactor: zoomExtentsFactor was set to: ${value}`);
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
        this.#logger.debugLow(`Camera(${this.id}).animate: Animating with path ${path} and options ${options}.`);
        for(let i = 0; i < path.length; i++) {
            this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, path[i].position, 'vec3');
            this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, path[i].target, 'vec3');
        }
        this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, options, 'object', false);
        const o = Object.assign({}, options);
        this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, o.easing, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, o.duration, 'number', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, o.default, 'boolean', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, o.coordinates, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).animate`, o.interpolation, 'string', false);
        this.#logger.info(`Camera(${this.id}).animate: Starting camera path animation.`);
        return this.#camera.animate(path, o);
    }

    /**
     * Reset the camera to its default position and target.
     * 
     * @param options various options to be adjusted
     * @returns 
     */
    public reset(options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        this.#logger.debugLow(`Camera(${this.id}).reset: Resetting with options ${options}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).reset`, options, 'object');
        const o = Object.assign({}, options);
        this.#inputValidator.validateAndError(`Camera(${this.id}).reset`, o.easing, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).reset`, o.duration, 'number', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).reset`, o.coordinates, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).reset`, o.interpolation, 'string', false);
        this.#logger.info(`Camera(${this.id}).reset: Resetting position and target.`);
        return this.#camera.reset(o);    
    }

    /**
     * Set the camera to its a specific position and target.
     * 
     * @param options various options to be adjusted
     * @returns 
     */
    public set(position: vec3, target: vec3, options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        this.#logger.debugLow(`Camera(${this.id}).set: Setting to position ${position} and target ${target} with options ${options}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, position, 'vec3');
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, target, 'vec3');
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, options, 'object');
        const o = Object.assign({}, options);
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, o.easing, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, o.duration, 'number', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, o.coordinates, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).set`, o.interpolation, 'string', false);
        this.#logger.info(`Camera(${this.id}).set: Setting position to ${position} and target to ${target}.`);
        return this.#camera.set(vec3.fromValues(position[0], position[1], position[2]), vec3.fromValues(target[0], target[1], target[2]), o);      
    }

    /**
     * Enable / Disable that the camera adjusts to geometry updates
     * @param {boolean} value
     */
    public updateAutoAdjust(value: boolean) {
        this.#logger.debugLow(`Camera(${this.id}).updateAutoAdjust: Updating AutoAdjust to ${value}.`);
        this.#inputValidator.validateAndError(`Camera(${this.id}).updateAutoAdjust`, value, 'boolean');
        this.#camera.autoAdjust = value;
        this.#logger.info(`Camera(${this.id}).updateAutoAdjust: autoAdjust was set to: ${value}`);
    }

    /**
     * Zoom in on a specific part of the scene, or the whole scene (default).
     * 
     * @param zoomTarget the target to zoom to
     * @param options various options to be adjusted
     * @returns 
     */
    public zoomTo(zoomTarget?: string[] | Box, options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        this.#logger.debugLow(`Camera(${this.id}).zoomTo: Zooming to ${zoomTarget} with options ${options}.`);
        if(zoomTarget) {
            if(Array.isArray(zoomTarget)) {
                 this.#inputValidator.validateAndError(`Camera(${this.id}).zoomTo`, zoomTarget, 'stringArray');
            } else if(!(zoomTarget instanceof Box)) 
                this.#logger.errorMessage(`Camera(${this.id}).zoomTo: The specified zoom target does not have a valid type`);
        }
        const o = Object.assign({}, options);
        this.#inputValidator.validateAndError(`Camera(${this.id}).zoomTo`, o.easing, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).zoomTo`, o.duration, 'number', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).zoomTo`, o.coordinates, 'string', false);
        this.#inputValidator.validateAndError(`Camera(${this.id}).zoomTo`, o.interpolation, 'string', false);
        this.#logger.info(`Camera(${this.id}).zoomTo: Zooming in.`);
        return this.#camera.zoomTo(zoomTarget, o);  
    }

    // #endregion Public Methods (5)
}