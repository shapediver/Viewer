import { IOrthographicCameraControls, OrthographicCameraControls as OrthographicCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Logger, LOGGINGTOPIC, SDError } from "@shapediver/viewer.shared.utils";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";
import { Viewer } from "../../Viewer";

export class OrthographicCameraControls implements IOrthographicCameraControls {
    // #region Properties (23)

    readonly #controls: OrthographicCameraControlsLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;

    readonly damping!: number
    readonly enableKeyPan!: boolean;
    readonly enablePan!: boolean;
    readonly enableZoom!: boolean;
    readonly enabled!: boolean;
    readonly input!: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } };
    readonly keyPanSpeed!: number;
    readonly movementSmoothness!: number;
    readonly panSpeed!: number;
    readonly zoomSpeed!: number;
    readonly #updateCB = () => {
        (<any>this.damping) = this.#controls.damping;
        (<any>this.enableKeyPan) = this.#controls.enableKeyPan;
        (<any>this.enablePan) = this.#controls.enablePan;
        (<any>this.enableZoom) = this.#controls.enableZoom;
        (<any>this.enabled) = this.#controls.enabled;
        (<any>this.input) = this.#controls.input;
        (<any>this.keyPanSpeed) = this.#controls.keyPanSpeed;
        (<any>this.movementSmoothness) = this.#controls.movementSmoothness;
        (<any>this.panSpeed) = this.#controls.panSpeed;
        (<any>this.zoomSpeed) = this.#controls.zoomSpeed;
    }
    // #endregion Properties (23)

    // #region Constructors (1)

    /**
     * @ignore
     * @param controls 
     */
    constructor(controls: OrthographicCameraControlsLogic, viewer: Viewer) {
        try {
            this.#controls = controls;
            this.#viewer = viewer;
            (<OrthographicCameraControlsLogic>this.#controls).addUpdateCB(this.#updateCB);
            this.#updateCB();
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).constructor: OrthographicCameraControlsLogic api created.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls.constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

    /**
     * The damping of the camera movement
     * @param {number} value
     */
    public updateDamping(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateDamping: Updating Damping to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateDamping`, value, 'positive');
            this.#controls.damping = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateDamping: damping was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateDamping: Something unexpected happened.`, true)
        }
    }

    /**
     * Enable / Disable panning using the keyboard, also refer to enablePan
     * @param {boolean} value
     */
    public updateEnableKeyPan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnableKeyPan: Updating EnableKeyPan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnableKeyPan`, value, 'boolean');
            this.#controls.enableKeyPan = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnableKeyPan: enableKeyPan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateEnableKeyPan: Something unexpected happened.`, true)
        }
    }

    /**
     * Enable / Disable panning in general, also refer to enableKeyPan
     * @param {boolean} value
     */
    public updateEnablePan(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnablePan: Updating EnablePan to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnablePan`, value, 'boolean');
            this.#controls.enablePan = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnablePan: enablePan was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateEnablePan: Something unexpected happened.`, true)
        }
    }

    /**
     * Enable / Disable zooming
     * @param {boolean} value
     */
    public updateEnableZoom(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnableZoom: Updating EnableZoom to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnableZoom`, value, 'boolean');
            this.#controls.enableZoom = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnableZoom: enableZoom was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateEnableZoom: Something unexpected happened.`, true)
        }
    }

    /**
     * Enable / Disable the Camera Controls
     * @param {boolean} value
     */
    public updateEnabled(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnabled: Updating Enabled to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnabled`, value, 'boolean');
            this.#controls.enabled = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateEnabled: enabled was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateEnabled: Something unexpected happened.`, true)
        }
    }

    /**
     * The input definition
     * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
     */
    public updateInput(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput: Updating Input to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.keys.down, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.keys.left, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.keys.right, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.keys.up, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.mouse.pan, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.mouse.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.mouse.zoom, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.touch.pan, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.touch.rotate, 'number');
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput`, value.touch.zoom, 'number');
            this.#controls.input = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateInput: input was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateInput: Something unexpected happened.`, true)
        }
    }

    /**
     * Speed of panning when using the keyboard
     * @param {number} value
     */
    public updateKeyPanSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateKeyPanSpeed: Updating KeyPanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateKeyPanSpeed`, value, 'factor');
            this.#controls.keyPanSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateKeyPanSpeed: keyPanSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateKeyPanSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * The effect the previous movement has on the next one
     * @param {number} value
     */
    public updateMovementSmoothness(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateMovementSmoothness: Updating MovementSmoothness to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateMovementSmoothness`, value, 'factor');
            this.#controls.movementSmoothness = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateMovementSmoothness: movementSmoothness was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateMovementSmoothness: Something unexpected happened.`, true)
        }
    }

    /**
     * Speed of panning
     * @param {number} value
     */
    public updatePanSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updatePanSpeed: Updating PanSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updatePanSpeed`, value, 'factor');
            this.#controls.panSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updatePanSpeed: panSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updatePanSpeed: Something unexpected happened.`, true)
        }
    }

    /**
     * Speed of zooming
     * @param {number} value
     */
    public updateZoomSpeed(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateZoomSpeed: ZoomSpeed to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateZoomSpeed`, value, 'factor');
            this.#controls.zoomSpeed = value;
            this.#logger.info(LOGGINGTOPIC.CAMERACONTROL, `Controls(${this.#controls.camera.id}).updateZoomSpeed: zoomSpeed was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERACONTROL, new SDError(e.message, e), `Controls(${this.#controls.camera.id}).updateZoomSpeed: Something unexpected happened.`, true)
        }
    }

}