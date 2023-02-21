import { IOrthographicCamera, ORTHOGRAPHIC_CAMERA_DIRECTION } from "@shapediver/viewer.rendering-engine.camera-engine";
import { IOrthographicCameraApi } from "../../../interfaces/viewport/camera/IOrthographicCameraApi";
import { AbstractCameraApi } from "./AbstractCameraApi";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IViewportApi } from "../../../interfaces/viewport/IViewportApi";

export class OrthographicCameraApi extends AbstractCameraApi implements IOrthographicCameraApi {
    // #region Properties (1)

    readonly #camera: IOrthographicCamera;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewportApi: IViewportApi;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(viewportApi: IViewportApi, camera: IOrthographicCamera) {
        super(viewportApi, camera);
        this.#viewportApi = viewportApi;
        this.#camera = camera;
        this.scope = 'OrthographicCameraApi';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (18)

    public get damping(): number {
        return this.#camera.controls.damping;
    }

    public set damping(value: number) {
        const scope = 'damping';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.controls.damping = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
        return this.#camera.direction;
    }

    public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
        const scope = 'direction';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'enum', true, Object.values(ORTHOGRAPHIC_CAMERA_DIRECTION));
            this.#camera.direction = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get enableKeyPan(): boolean {
        return this.#camera.controls.enableKeyPan;
    }

    public set enableKeyPan(value: boolean) {
        const scope = 'enableKeyPan';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'boolean');
            this.#camera.controls.enableKeyPan = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get enablePan(): boolean {
        return this.#camera.controls.enablePan;
    }

    public set enablePan(value: boolean) {
        const scope = 'enablePan';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'boolean');
            this.#camera.controls.enablePan = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get enableZoom(): boolean {
        return this.#camera.controls.enableZoom;
    }

    public set enableZoom(value: boolean) {
        const scope = 'enableZoom';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'boolean');
            this.#camera.controls.enableZoom = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get keyPanSpeed(): number {
        return this.#camera.controls.keyPanSpeed;
    }

    public set keyPanSpeed(value: number) {
        const scope = 'keyPanSpeed';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.controls.keyPanSpeed = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get movementSmoothness(): number {
        return this.#camera.controls.movementSmoothness;
    }

    public set movementSmoothness(value: number) {
        const scope = 'movementSmoothness';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.controls.movementSmoothness = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get panSpeed(): number {
        return this.#camera.controls.panSpeed;
    }

    public set panSpeed(value: number) {
        const scope = 'panSpeed';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.controls.panSpeed = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    public get zoomSpeed(): number {
        return this.#camera.controls.zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        const scope = 'zoomSpeed';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, value, 'number');
            this.#camera.controls.zoomSpeed = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}: ${scope} was set to: ${value}`);
            this.#viewportApi.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `${this.scope}.${scope}`, e);
        }
    }

    // #endregion Public Accessors (18)
}