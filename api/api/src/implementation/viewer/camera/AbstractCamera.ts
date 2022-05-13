import { CAMERA_TYPE } from '@shapediver/viewer.rendering-engine.camera-engine'
import { container } from 'tsyringe'
import { vec2, vec3 } from 'gl-matrix'
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerCameraError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { Box } from '@shapediver/viewer.shared.math'

import { ICamera } from '../../../interfaces/viewer/camera/ICamera'
import { IViewer } from '../../../interfaces/viewer/IViewer'
import { Tree } from '@shapediver/viewer.shared.node-tree'

export abstract class AbstractCamera implements ICamera {
    // #region Properties (5)

    readonly #camera: ICamera;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #tree: Tree = <Tree>container.resolve(Tree);
    readonly #viewer: IViewer;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: ICamera, viewer: IViewer) {
        try {
            this.#camera = camera;
            this.#viewer = viewer;
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).constructor: Camera api created.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).constructor`, e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (24)

    public get autoAdjust(): boolean {
        return this.#camera.autoAdjust;
    }

    public set autoAdjust(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).autoAdjust: Updating AutoAdjust to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).autoAdjust`, value, 'boolean');
            this.#camera.autoAdjust = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).autoAdjust: autoAdjust was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).autoAdjust`, e);
        }
    }

    public get cameraMovementDuration(): number {
        return this.#camera.cameraMovementDuration;
    }

    public set cameraMovementDuration(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).cameraMovementDuration: Updating CameraMovementDuration to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).cameraMovementDuration`, value, 'positive');
            this.#camera.cameraMovementDuration = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).cameraMovementDuration: cameraMovementDuration was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).cameraMovementDuration`, e);
        }
    }

    public get defaultPosition(): vec3 {
        return this.#camera.defaultPosition;
    }

    public set defaultPosition(value: vec3) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultPosition: Updating DefaultPosition to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultPosition`, value, 'vec3');
            this.#camera.defaultPosition = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultPosition: defaultPosition was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultPosition`, e);
        }
    }

    public get defaultTarget(): vec3 {
        return this.#camera.defaultTarget;
    }

    public set defaultTarget(value: vec3) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultTarget: Updating DefaultTarget to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultTarget`, value, 'vec3');
            this.#camera.defaultTarget = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultTarget: defaultTarget was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).defaultTarget`, e);
        }
    }

    public get enableCameraControls(): boolean {
        return this.#camera.enableCameraControls;
    }

    public set enableCameraControls(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).enableCameraControls: Updating EnableCameraControls to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).enableCameraControls`, value, 'boolean');
            this.#camera.enableCameraControls = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).enableCameraControls: enableCameraControls was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).enableCameraControls`, e);
        }
    }

    public get id(): string {
        return this.#camera.id;
    }

    public get order(): number | undefined {
        return this.#camera.order;
    }

    public set order(value: number | undefined) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).order: Updating Order to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).order`, value, 'number', false);
            this.#camera.order = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).order: order was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).order`, e);
        }
    }

    public get position(): vec3 {
        return this.#camera.position;
    }

    public set position(value: vec3) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).position: Updating Position to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).position`, value, 'vec3');
            this.#camera.position = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).position: position was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).position`, e);
        }
    }

    public get revertAtMouseUp(): boolean {
        return this.#camera.revertAtMouseUp;
    }

    public set revertAtMouseUp(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUp: Updating RevertAtMouseUp to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUp`, value, 'boolean');
            this.#camera.revertAtMouseUp = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUp: revertAtMouseUp was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUp`, e);
        }
    }

    public get revertAtMouseUpDuration(): number {
        return this.#camera.revertAtMouseUpDuration;
    }

    public set revertAtMouseUpDuration(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUpDuration: Updating RevertAtMouseUpDuration to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUpDuration`, value, 'positive');
            this.#camera.revertAtMouseUpDuration = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUpDuration: revertAtMouseUpDuration was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).revertAtMouseUpDuration`, e);
        }
    }

    public get target(): vec3 {
        return this.#camera.target;
    }

    public set target(value: vec3) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).target: Updating Target to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).target`, value, 'vec3');
            this.#camera.target = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).target: target was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).target`, e);
        }
    }

    public get type(): CAMERA_TYPE {
        return this.#camera.type;
    }

    public get zoomExtentsFactor(): number {
        return this.#camera.zoomExtentsFactor;
    }

    public set zoomExtentsFactor(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomExtentsFactor: Updating ZoomExtentsFactor to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomExtentsFactor`, value, 'positive');
            this.#camera.zoomExtentsFactor = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomExtentsFactor: zoomExtentsFactor was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomExtentsFactor`, e);
        }
    }

    // #endregion Public Accessors (24)

    // #region Public Methods (6)

    /**
     * Let the camera follow a path from different position and target pairs to another.
     * 
     * @param path the defined path
     * @param options various options to be adjusted
     * @returns 
     */
    public animate(path: { position: vec3; target: vec3; }[], options?: { easing?: string; duration?: number; default?: boolean; coordinates?: string; interpolation?: string; }): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate: Animating with path ${path} and options ${JSON.stringify(options)}.`);
            for (let i = 0; i < path.length; i++) {
                this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, path[i].position, 'vec3');
                this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, path[i].target, 'vec3');
            }
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, o.default, 'boolean', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, o.interpolation, 'string', false);
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate: Starting camera path animation.`);
            return this.#camera.animate(path, o);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).animate`, e);
        }
    }

    /**
     * Calculate the position for our {@link zoomTo} method.
     * A specific target can be provided, as well as a specific camera startingPosition and startingTarget.
     * If no target is provided, the current bounding box is used.
     * If not startingPosition and startingTarget are provided, the current camera position and target are used.
     * 
     * @param zoomTarget 
     * @param startingPosition 
     * @param startingTarget 
     * @returns 
     */
    public calculateZoomTo(zoomTarget?: Box, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; } {
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).getZoomPositionAndTarget`, startingTarget, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).getZoomPositionAndTarget`, startingPosition, 'vec3', false);
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).getZoomPositionAndTarget: Getting position and target for zoomTarget ${zoomTarget}.`);
            let target: Box | undefined;
            if (zoomTarget) {
                if (Array.isArray(zoomTarget)) {
                    this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).getZoomPositionAndTarget`, zoomTarget, 'stringArray');
                    target = new Box();
                    for(let i = 0; i < zoomTarget.length; i++) {
                        const node = this.#tree.getNodeAtPath(zoomTarget[i]);
                        if(node) target.union(node.boundingBox);
                    }
                } else if (zoomTarget instanceof Box) {
                    target = zoomTarget.clone();
                } else {
                    const error = new ShapeDiverViewerCameraError(`Camera(${this.id}).getZoomPositionAndTarget: No valid zoom target supplied.`);
                    throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).getZoomPositionAndTarget`, error);
                }
            }
            return this.#camera.calculateZoomTo(target, startingPosition, startingTarget);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).getZoomPositionAndTarget`, e);
        }
    }

    public project(p: vec3): vec2 {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).project: Projecting point ${p}.`);
            return this.#camera.project(p);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).project`, e);
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
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset: Resetting with options ${JSON.stringify(options)}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset`, o.interpolation, 'string', false);
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset: Resetting position and target.`);
            return this.#camera.reset(o);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).reset`, e);
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
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set: Setting to position ${position} and target ${target} with options ${JSON.stringify(options)}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, position, 'vec3');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, target, 'vec3');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, o.interpolation, 'string', false);
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set: Setting position to ${position} and target to ${target}.`);
            return this.#camera.set(vec3.fromValues(position[0], position[1], position[2]), vec3.fromValues(target[0], target[1], target[2]), o);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).set`, e);
        }
    }

    public unproject(p: vec3): vec3 {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).unproject: Unprojecting point ${p}.`);
            return this.#camera.unproject(p);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).unproject`, e);
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
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo: Zooming to ${zoomTarget} with options ${JSON.stringify(options)}.`);
            let target: Box | undefined;
            if (zoomTarget) {
                if (Array.isArray(zoomTarget)) {
                    this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, zoomTarget, 'stringArray');
                    target = new Box();
                    for(let i = 0; i < zoomTarget.length; i++) {
                        const node = this.#tree.getNodeAtPath(zoomTarget[i]);
                        if(node) target.union(node.boundingBox);
                    }
                } else if (zoomTarget instanceof Box) {
                    target = zoomTarget.clone();
                } else {
                    const error = new ShapeDiverViewerCameraError(`Camera(${this.id}).zoomTo: No valid zoom target supplied.`);
                    throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, error);
                }
            }
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, options, 'object', false);
            const o = Object.assign({}, options);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.easing, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.duration, 'number', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.coordinates, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, o.interpolation, 'string', false);
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo: Zooming in.`);
            return this.#camera.zoomTo(target, o);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.id}).zoomTo`, e);
        }
    }

    // #endregion Public Methods (6)
}