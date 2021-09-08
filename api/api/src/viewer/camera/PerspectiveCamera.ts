import {
    IPerspectiveCamera,
    PerspectiveCamera as PerspectiveCameraLogic,
    PerspectiveCameraControls as PerspectiveCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { Logger, LOGGINGTOPIC, SDError, InputValidator } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { Viewer } from '../Viewer'
import { Camera } from './Camera'
import { PerspectiveCameraControls } from './controls/PerspectiveCameraControls'

export class PerspectiveCamera extends Camera implements IPerspectiveCamera {
    // #region Properties (5)

    readonly #camera: PerspectiveCameraLogic;
    readonly #controls: PerspectiveCameraControls;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: PerspectiveCameraLogic, viewer: Viewer) {
        super(camera, viewer);
        try {
            this.#camera = camera;
            this.#viewer = viewer;
            this.#controls = new PerspectiveCameraControls(<PerspectiveCameraControlsLogic>camera.controls, viewer);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter controls
     */
    public get controls(): PerspectiveCameraControls {
        return this.#controls;
    }

    /**
     * Getter fov
     */
    public get fov(): number {
        return this.#camera.fov;
    }

    /**
     * Setter fov
     */
    public set fov(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov: Updating Fov to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov`, value, 'positive');
            this.#camera.fov = value;
            this.#viewer.update();
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov: fov was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).fov: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (3)
}