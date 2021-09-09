import {
  OrthographicCameraControls as OrthographicCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
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
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).constructor: OrthographicCameraControlsLogic api created.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls.constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

    /**
     * Getter damping
     */
    public get damping(): number {
        return this.#controls.damping;
    }

    /**
     * Setter damping
     */
    public set damping(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).damping: Updating Damping to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateDamping`, value, 'positive');
            this.#controls.damping = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).damping: damping was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).damping: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableKeyPan
     */
    public get enableKeyPan(): boolean {
        return this.#controls.enableKeyPan;
    }

    /**
     * Setter enableKeyPan
     */
    public set enableKeyPan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan: Updating EnableKeyPan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan`, value, 'boolean');
            this.#controls.enableKeyPan = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableKeyPan: enableKeyPan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enableKeyPan: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enablePan
     */
    public get enablePan(): boolean {
        return this.#controls.enablePan;
    }

    /**
     * Setter enablePan
     */
    public set enablePan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enablePan: Updating EnablePan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enablePan`, value, 'boolean');
            this.#controls.enablePan = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enablePan: enablePan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enablePan: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enableZoom
     */
    public get enableZoom(): boolean {
        return this.#controls.enableZoom;
    }

    /**
     * Setter enableZoom
     */
    public set enableZoom(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableZoom: Updating EnableZoom to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableZoom`, value, 'boolean');
            this.#controls.enableZoom = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enableZoom: enableZoom was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enableZoom: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter enabled
     */
    public get enabled(): boolean {
        return this.#controls.enabled;
    }

    /**
     * Setter enabled
     */
    public set enabled(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enabled: Updating Enabled to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enabled`, value, 'boolean');
            this.#controls.enabled = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).enabled: enabled was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).enabled: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter input
     */
    public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
        return this.#controls.input;
    }

    /**
     * Setter input
     */
    public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input: Updating Input to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.down, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.left, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.right, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.keys.up, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.pan, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.mouse.zoom, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.pan, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input`, value.touch.zoom, 'number');
            this.#controls.input = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).input: input was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).input: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter keyPanSpeed
     */
    public get keyPanSpeed(): number {
        return this.#controls.keyPanSpeed;
    }

    /**
     * Setter keyPanSpeed
     */
    public set keyPanSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed: Updating KeyPanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed`, value, 'factor');
            this.#controls.keyPanSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).keyPanSpeed: keyPanSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).keyPanSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter movementSmoothness
     */
    public get movementSmoothness(): number {
        return this.#controls.movementSmoothness;
    }

    /**
     * Setter movementSmoothness
     */
    public set movementSmoothness(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness: Updating MovementSmoothness to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness`, value, 'factor');
            this.#controls.movementSmoothness = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).movementSmoothness: movementSmoothness was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).movementSmoothness: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter panSpeed
     */
    public get panSpeed(): number {
        return this.#controls.panSpeed;
    }

    /**
     * Setter panSpeed
     */
    public set panSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).panSpeed: Updating PanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).panSpeed`, value, 'factor');
            this.#controls.panSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).panSpeed: panSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).panSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter zoomSpeed
     */
    public get zoomSpeed(): number {
        return this.#controls.zoomSpeed;
    }

    /**
     * Setter zoomSpeed
     */
    public set zoomSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed: ZoomSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed`, value, 'factor');
            this.#controls.zoomSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).zoomSpeed: zoomSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, e, `Controls(${this.#controls.camera.id}).zoomSpeed: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (20)
}