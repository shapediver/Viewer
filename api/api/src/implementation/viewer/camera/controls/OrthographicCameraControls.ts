import {
  OrthographicCameraControls as OrthographicCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { IOrthographicCameraControls } from '../../../../interfaces/viewer/camera/controls/IOrthographicCameraControls'
import { IViewer } from '../../../../interfaces/viewer/IViewer'

export class OrthographicCameraControls implements IOrthographicCameraControls {
    // #region Properties (4)

    readonly #controls: OrthographicCameraControlsLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param controls 
     */
    constructor(controls: OrthographicCameraControlsLogic, viewer: IViewer) {
        try {
            this.#controls = controls;
            this.#viewer = viewer;
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).constructor: OrthographicCameraControlsLogic api created.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${controls.camera.id}).constructor`, e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

    public get damping(): number {
        return this.#controls.damping;
    }

    public set damping(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).damping: Updating Damping to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).updateDamping`, value, 'positive');
            this.#controls.damping = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).damping: damping was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).damping`, e);
        }
    }

    public get enableKeyPan(): boolean {
        return this.#controls.enableKeyPan;
    }

    public set enableKeyPan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan: Updating EnableKeyPan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan`, value, 'boolean');
            this.#controls.enableKeyPan = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan: enableKeyPan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).enableKeyPan`, e);
        }
    }

    public get enablePan(): boolean {
        return this.#controls.enablePan;
    }

    public set enablePan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enablePan: Updating EnablePan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enablePan`, value, 'boolean');
            this.#controls.enablePan = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enablePan: enablePan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).enablePan`, e);
        }
    }

    public get enableZoom(): boolean {
        return this.#controls.enableZoom;
    }

    public set enableZoom(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enableZoom: Updating EnableZoom to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enableZoom`, value, 'boolean');
            this.#controls.enableZoom = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enableZoom: enableZoom was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).enableZoom`, e);
        }
    }

    public get enabled(): boolean {
        return this.#controls.enabled;
    }

    public set enabled(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enabled: Updating Enabled to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enabled`, value, 'boolean');
            this.#controls.enabled = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).enabled: enabled was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).enabled`, e);
        }
    }

    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this.#controls.input;
    }

    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input: Updating Input to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.down, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.left, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.right, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.up, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.pan, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.zoom, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.pan, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.zoom, 'number');
            this.#controls.input = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).input: input was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).input`, e);
        }
    }

    public get keyPanSpeed(): number {
        return this.#controls.keyPanSpeed;
    }

    public set keyPanSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed: Updating KeyPanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed`, value, 'factor');
            this.#controls.keyPanSpeed = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed: keyPanSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).keyPanSpeed`, e);
        }
    }

    public get movementSmoothness(): number {
        return this.#controls.movementSmoothness;
    }

    public set movementSmoothness(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness: Updating MovementSmoothness to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness`, value, 'factor');
            this.#controls.movementSmoothness = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness: movementSmoothness was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).movementSmoothness`, e);
        }
    }

    public get panSpeed(): number {
        return this.#controls.panSpeed;
    }

    public set panSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).panSpeed: Updating PanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).panSpeed`, value, 'factor');
            this.#controls.panSpeed = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).panSpeed: panSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).panSpeed`, e);
        }
    }

    public get zoomSpeed(): number {
        return this.#controls.zoomSpeed;
    }

    public set zoomSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed: ZoomSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed`, value, 'factor');
            this.#controls.zoomSpeed = value;
            this.#logger.debug(LOGGING_TOPIC.CAMERA_CONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed: zoomSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.CAMERA, `Camera(${this.#controls.camera.id}).zoomSpeed`, e);
        }
    }

    // #endregion Public Accessors (20)
}