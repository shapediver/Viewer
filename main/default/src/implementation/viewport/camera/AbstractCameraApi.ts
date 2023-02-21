import { vec3, vec2 } from "gl-matrix";
import { CAMERA_TYPE, ICamera, ICameraOptions } from "@shapediver/viewer.rendering-engine.camera-engine";
import { ICameraApi } from "../../../interfaces/viewport/camera/ICameraApi";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerValidationError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { Box, IBox } from "@shapediver/viewer.shared.math";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";

export abstract class AbstractCameraApi implements ICameraApi {
    // #region Properties (15)

    readonly #camera: ICamera;
    readonly #viewportApi: IViewportApi;

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    readonly #validateOptions = (scope: string, options?: ICameraOptions) => {
        this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, options, 'object', false);
        const prop = Object.assign({}, options);
        this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, prop.easing, 'string', false);
        this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, prop.duration, 'number', false);
        this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, prop.coordinates, 'string', false);
        this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, prop.interpolation, 'string', false);
    }
    
    protected scope: string = 'AbstractCameraApi';

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, camera: ICamera) {
        this.#viewportApi = viewportApi;
        this.#camera = camera;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (28)

    public get autoAdjust(): boolean {
        return this.#camera.autoAdjust;
    }

    public set autoAdjust(value: boolean) {
        const scope = 'autoAdjust';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'boolean');
            this.#camera.autoAdjust = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get cameraMovementDuration(): number {
        return this.#camera.cameraMovementDuration;
    }

    public set cameraMovementDuration(value: number) {
        const scope = 'cameraMovementDuration';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.cameraMovementDuration = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get defaultPosition(): vec3 {
        return this.#camera.defaultPosition;
    }

    public set defaultPosition(value: vec3) {
        const scope = 'defaultPosition';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'vec3');
            this.#camera.defaultPosition = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get defaultTarget(): vec3 {
        return this.#camera.defaultTarget;
    }

    public set defaultTarget(value: vec3) {
        const scope = 'defaultTarget';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'vec3');
            this.#camera.defaultTarget = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get enabled(): boolean {
        return this.#camera.controls.enabled;
    }

    public set enabled(value: boolean) {
        const scope = 'enabled';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'boolean');
            this.#camera.controls.enabled = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get id(): string {
        return this.#camera.id;
    }

    public get name(): string | undefined {
        return this.#camera.name;
    }

    public set name(value: string | undefined) {
        const scope = 'name';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'string', false);
            this.#camera.name = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get order(): number | undefined {
        return this.#camera.order;
    }

    public set order(value: number | undefined) {
        const scope = 'order';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number', false);
            this.#camera.order = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get position(): vec3 {
        return this.#camera.position;
    }

    public set position(value: vec3) {
        const scope = 'position';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'vec3');
            this.#camera.position = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get revertAtMouseUp(): boolean {
        return this.#camera.revertAtMouseUp;
    }

    public set revertAtMouseUp(value: boolean) {
        const scope = 'revertAtMouseUp';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'boolean');
            this.#camera.revertAtMouseUp = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get revertAtMouseUpDuration(): number {
        return this.#camera.revertAtMouseUpDuration;
    }

    public set revertAtMouseUpDuration(value: number) {
        const scope = 'revertAtMouseUpDuration';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.revertAtMouseUpDuration = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get target(): vec3 {
        return this.#camera.target;
    }

    public set target(value: vec3) {
        const scope = 'target';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'vec3');
            this.#camera.target = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get type(): CAMERA_TYPE {
        return this.#camera.type;
    }

    public get zoomToFactor(): number {
        return this.#camera.zoomExtentsFactor;
    }

    public set zoomToFactor(value: number) {
        const scope = 'zoomToFactor';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.zoomExtentsFactor = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    // #endregion Public Accessors (28)

    // #region Public Methods (7)

    public animate(path: { position: vec3; target: vec3; }[], options?: ICameraOptions): Promise<boolean> {
        const scope = 'animate';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, path, 'array');
            for(let i = 0; i < path.length; i++) {
                this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, path[i].position, 'vec3');
                this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, path[i].target, 'vec3');
            }
            this.#validateOptions(scope, options);

            return this.#camera.animate(path, options);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public calculateZoomTo(zoomTarget?: IBox, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; } {
        const scope = 'calculateZoomTo';
        try {
            if (zoomTarget !== undefined && !(zoomTarget instanceof Box)) {
                const error = new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${zoomTarget} is not of type Box.`, zoomTarget, 'Box');
                throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, error, false);
            }
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, startingPosition, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, startingTarget, 'vec3', false);

            return this.#camera.calculateZoomTo(zoomTarget, startingPosition, startingTarget);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public project(p: vec3): vec2 {
        const scope = 'project';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, p, 'vec3');
            return this.#camera.project(p);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public reset(options?: ICameraOptions): Promise<boolean> {
        const scope = 'reset';
        try {
            this.#validateOptions(scope, options);
            return this.#camera.reset(options);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public set(position: vec3, target: vec3, options?: ICameraOptions): Promise<boolean> {
        const scope = 'set';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, position, 'vec3', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, target, 'vec3', false);
            this.#validateOptions(scope, options);
            return this.#camera.set(position, target, options);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public unproject(p: vec3): vec3 {
        const scope = 'unproject';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, p, 'vec3', false);
            return this.#camera.unproject(p);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public zoomTo(zoomTarget?: IBox, options?: ICameraOptions): Promise<boolean> {
        const scope = 'zoomTo';
        try {
            if (zoomTarget !== undefined && !(zoomTarget instanceof Box)) {
                const error = new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${zoomTarget} is not of type Box.`, zoomTarget, 'Box');
                throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, error, false);
            }
            this.#validateOptions(scope, options);
            return this.#camera.zoomTo(zoomTarget, options);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    // #endregion Public Methods (7)
}