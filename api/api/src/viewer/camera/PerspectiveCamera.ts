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
    // #region Properties (6)

    readonly #camera: PerspectiveCameraLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;
    readonly #updateCB = () => {
        (<any>this.fov) = this.#camera.fov;
    }

    readonly controls: PerspectiveCameraControls
    readonly fov!: number;

    // #endregion Properties (6)

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
            this.controls = new PerspectiveCameraControls(<PerspectiveCameraControlsLogic>camera.controls, viewer);
            (<PerspectiveCameraLogic>this.#camera).addUpdateCB(this.#updateCB);
            this.#updateCB();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Camera frustum vertical field of view angle, unit degree, interval [0,180]
     * @param {number} value
     */
    public updateFov(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateFov: Updating Fov to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateFov`, value, 'positive');
            this.#camera.fov = value;
            this.#viewer.update();
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateFov: fov was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).updateFov: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (1)
}