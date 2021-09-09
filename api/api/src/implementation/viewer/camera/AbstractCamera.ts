import { CAMERATYPE } from '@shapediver/viewer.rendering-engine.camera-engine'
import { container } from 'tsyringe'
import { vec3 } from 'gl-matrix'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { Box } from '@shapediver/viewer.shared.math'

import { ICamera } from '../../../interfaces/viewer/camera/ICamera'
import { IViewer } from '../../../interfaces/viewer/IViewer'

export abstract class AbstractCamera implements ICamera {
    // #region Properties (4)

    readonly #camera: ICamera;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: ICamera, viewer: IViewer) {
        try {
            this.#camera = camera;
            this.#viewer = viewer;
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).constructor: Camera api created.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (24)

    /**
     * Setter autoAdjust
     */
    public set autoAdjust(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).autoAdjust: Updating AutoAdjust to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).autoAdjust`, value, 'boolean');
            this.#camera.autoAdjust = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).autoAdjust: autoAdjust was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).autoAdjust: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter autoAdjust
     */
    public get autoAdjust(): boolean {
        return this.#camera.autoAdjust;
    }

    /**
     * Getter cameraMovementDuration
     */
    public get cameraMovementDuration(): number {
        return this.#camera.cameraMovementDuration;
    }

    /**
     * Setter cameraMovementDuration
     */
    public set cameraMovementDuration(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateCameraMovementDuration: Updating CameraMovementDuration to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateCameraMovementDuration`, value, 'positive');
            this.#camera.cameraMovementDuration = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateCameraMovementDuration: cameraMovementDuration was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateCameraMovementDuration: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter defaultPosition
     */
    public get defaultPosition(): vec3 {
        return this.#camera.defaultPosition;
    }

    /**
     * Setter defaultPosition
     */
    public set defaultPosition(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDefaultPosition: Updating DefaultPosition to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDefaultPosition`, value, 'vec3');
            this.#camera.defaultPosition = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDefaultPosition: defaultPosition was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateDefaultPosition: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter defaultTarget
     */
    public get defaultTarget(): vec3 {
        return this.#camera.defaultTarget;
    }

    /**
     * Setter defaultTarget
     */
    public set defaultTarget(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDefaultTarget: Updating DefaultTarget to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDefaultTarget`, value, 'vec3');
            this.#camera.defaultTarget = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDefaultTarget: defaultTarget was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateDefaultTarget: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableCameraControls
     */
    public get enableCameraControls(): boolean {
        return this.#camera.enableCameraControls;
    }

    /**
     * Setter enableCameraControls
     */
    public set enableCameraControls(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateEnableCameraControls: Updating EnableCameraControls to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateEnableCameraControls`, value, 'boolean');
            this.#camera.enableCameraControls = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateEnableCameraControls: enableCameraControls was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateEnableCameraControls: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter id
     */
    public get id(): string {
        return this.#camera.id;
    }

    /**
     * Getter order
     */
    public get order(): number | undefined {
        return this.#camera.order;
    }

    /**
     * Setter order
     */
    public set order(value: number | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateOrder: Updating Order to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateOrder`, value, 'number', false);
            this.#camera.order = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateOrder: order was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateOrder: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter position
     */
    public get position(): vec3 {
        return this.#camera.position;
    }

    /**
     * Setter position
     */
    public set position(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updatePosition: Updating Position to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updatePosition`, value, 'vec3');
            this.#camera.position = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updatePosition: position was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updatePosition: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter revertAtMouseUp
     */
    public get revertAtMouseUp(): boolean {
        return this.#camera.revertAtMouseUp;
    }

    /**
     * Setter revertAtMouseUp
     */
    public set revertAtMouseUp(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateRevertAtMouseUp: Updating RevertAtMouseUp to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateRevertAtMouseUp`, value, 'boolean');
            this.#camera.revertAtMouseUp = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateRevertAtMouseUp: revertAtMouseUp was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateRevertAtMouseUp: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter revertAtMouseUpDuration
     */
    public get revertAtMouseUpDuration(): number {
        return this.#camera.revertAtMouseUpDuration;
    }

    /**
     * Setter revertAtMouseUpDuration
     */
    public set revertAtMouseUpDuration(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateRevertAtMouseUpDuration: Updating RevertAtMouseUpDuration to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateRevertAtMouseUpDuration`, value, 'positive');
            this.#camera.revertAtMouseUpDuration = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateRevertAtMouseUpDuration: revertAtMouseUpDuration was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateRevertAtMouseUpDuration: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter target
     */
    public get target(): vec3 {
        return this.#camera.target;
    }

    /**
     * Setter target
     */
    public set target(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateTarget: Updating Target to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateTarget`, value, 'vec3');
            this.#camera.target = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateTarget: target was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateTarget: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter type
     */
    public get type(): CAMERATYPE {
        return this.#camera.type;
    }

    /**
     * Getter zoomExtentsFactor
     */
    public get zoomExtentsFactor(): number {
        return this.#camera.zoomExtentsFactor;
    }

    /**
     * Setter zoomExtentsFactor
     */
    public set zoomExtentsFactor(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateZoomExtentsFactor: Updating ZoomExtentsFactor to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateZoomExtentsFactor`, value, 'positive');
            this.#camera.zoomExtentsFactor = value;
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateZoomExtentsFactor: zoomExtentsFactor was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateZoomExtentsFactor: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (24)

    // #region Public Methods (4)

    /**
     * Let the camera follow a path from different position and target pairs to another.
     * 
     * @param path the defined path
     * @param options various options to be adjusted
     * @returns 
     */
    public animate(path: { position: vec3; target: vec3; }[], options?: { easing?: string; duration?: number; default?: boolean; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate: Animating with path ${path} and options ${JSON.stringify(options)}.`);
            for (let i = 0; i < path.length; i++) {
                this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, path[i].position, 'vec3');
                this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, path[i].target, 'vec3');
            }
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, o.default, 'boolean', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate`, o.interpolation, 'string', false);
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).animate: Starting camera path animation.`);
            return this.#camera.animate(path, o);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).animate: Something unexpected happened.`, true)
        }
    }

    /**
     * Reset the camera to its default position and target.
     * 
     * @param options various options to be adjusted
     * @returns 
     */
    public reset(options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset: Resetting with options ${JSON.stringify(options)}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset`, o.interpolation, 'string', false);
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).reset: Resetting position and target.`);
            return this.#camera.reset(o);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).reset: Something unexpected happened.`, true)
        }
    }

    /**
     * Set the camera to its a specific position and target.
     * 
     * @param options various options to be adjusted
     * @returns 
     */
    public set(position: vec3, target: vec3, options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set: Setting to position ${position} and target ${target} with options ${JSON.stringify(options)}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, position, 'vec3');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, target, 'vec3');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set`, o.interpolation, 'string', false);
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).set: Setting position to ${position} and target to ${target}.`);
            return this.#camera.set(vec3.fromValues(position[0], position[1], position[2]), vec3.fromValues(target[0], target[1], target[2]), o);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).set: Something unexpected happened.`, true)
        }
    }

    /**
     * Zoom in on a specific part of the scene, or the whole scene (default).
     * 
     * @param zoomTarget the target to zoom to
     * @param options various options to be adjusted
     * @returns 
     */
    public zoomTo(zoomTarget?: string[] | Box, options?: { easing?: string; duration?: number; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo: Zooming to ${zoomTarget} with options ${JSON.stringify(options)}.`);
            if (zoomTarget) {
                if (Array.isArray(zoomTarget)) {
                    this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo`, zoomTarget, 'stringArray');
                } else if (!(zoomTarget instanceof Box))
                    this.#logger.error(LOGGINGTOPIC.CAMERA, new SDError(`Camera(${this.id}).zoomTo: The specified zoom target does not have a valid type`));
            }
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.interpolation, 'string', false);
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).zoomTo: Zooming in.`);
            return this.#camera.zoomTo(zoomTarget, o);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).zoomTo: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (4)
}