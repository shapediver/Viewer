import { IOrthographicCameraControls, OrthographicCameraControls as OrthographicCameraControlsLogic } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export class OrthographicCameraControls implements IOrthographicCameraControls {
    // #region Properties (23)

    readonly #controls: OrthographicCameraControlsLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    
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
    constructor(controls: OrthographicCameraControlsLogic) {
        this.#controls = controls;
        (<OrthographicCameraControlsLogic>this.#controls).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

    /**
     * The damping of the camera movement
     * @param {number} value
     */
    public updateDamping(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#controls.damping = value;
        this.#logger.info(`Camera Controls: damping was set to: ${value}`);
    }

    /**
     * Enable / Disable panning using the keyboard, also refer to enablePan
     * @param {boolean} value
     */
    public updateEnableKeyPan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableKeyPan = value;
        this.#logger.info(`Camera Controls: enableKeyPan was set to: ${value}`);
    }

    /**
     * Enable / Disable panning in general, also refer to enableKeyPan
     * @param {boolean} value
     */
    public updateEnablePan(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enablePan = value;
        this.#logger.info(`Camera Controls: enablePan was set to: ${value}`);
    }

    /**
     * Enable / Disable zooming
     * @param {boolean} value
     */
    public updateEnableZoom(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enableZoom = value;
        this.#logger.info(`Camera Controls: enableZoom was set to: ${value}`);
    }

    /**
     * Enable / Disable the camera controls
     * @param {boolean} value
     */
    public updateEnabled(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#controls.enabled = value;
        this.#logger.info(`Camera Controls: enabled was set to: ${value}`);
    }

    /**
     * The input definition
     * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
     */
    public updateInput(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
        this.#inputValidator.validate(value.keys.down, 'number');
        this.#inputValidator.validate(value.keys.left, 'number');
        this.#inputValidator.validate(value.keys.right, 'number');
        this.#inputValidator.validate(value.keys.up, 'number');        
        this.#inputValidator.validate(value.mouse.pan, 'number');
        this.#inputValidator.validate(value.mouse.rotate, 'number');
        this.#inputValidator.validate(value.mouse.zoom, 'number');
        this.#inputValidator.validate(value.touch.pan, 'number');
        this.#inputValidator.validate(value.touch.rotate, 'number');
        this.#inputValidator.validate(value.touch.zoom, 'number');
        this.#controls.input = value;
        this.#logger.info(`Camera Controls: input was set to: ${value}`);
    }

    /**
     * Speed of panning when using the keyboard
     * @param {number} value
     */
    public updateKeyPanSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.keyPanSpeed = value;
        this.#logger.info(`Camera Controls: keyPanSpeed was set to: ${value}`);
    }

    /**
     * The effect the previous movement has on the next one
     * @param {number} value
     */
    public updateMovementSmoothness(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.movementSmoothness = value;
        this.#logger.info(`Camera Controls: movementSmoothness was set to: ${value}`);
    }

    /**
     * Speed of panning
     * @param {number} value
     */
    public updatePanSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.panSpeed = value;
        this.#logger.info(`Camera Controls: panSpeed was set to: ${value}`);
    }

    /**
     * Speed of zooming
     * @param {number} value
     */
    public updateZoomSpeed(value: number) {
        this.#inputValidator.validate(value, 'factor');
        this.#controls.zoomSpeed = value;
        this.#logger.info(`Camera Controls: zoomSpeed was set to: ${value}`);
    }

}