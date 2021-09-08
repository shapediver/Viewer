import {
    IOrthographicCamera,
    ORTHOGRAPHIC_CAMERA_DIRECTION,
    OrthographicCamera as OrthographicCameraLogic,
    OrthographicCameraControls as OrthographicCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { Logger, LOGGINGTOPIC, SDError, InputValidator } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { Viewer } from '../Viewer'
import { Camera } from './Camera'
import { OrthographicCameraControls } from './controls/OrthographicCameraControls'

export class OrthographicCamera extends Camera implements IOrthographicCamera {
    // #region Properties (5)

    readonly #camera: OrthographicCameraLogic;
    readonly #controls: OrthographicCameraControls;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: OrthographicCameraLogic, viewer: Viewer) {
        super(camera, viewer);
        try {
            this.#camera = camera;
            this.#viewer = viewer;
            this.#controls = new OrthographicCameraControls(<OrthographicCameraControlsLogic>camera.controls, viewer);
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
    public get controls(): OrthographicCameraControls {
        return this.#controls;
    }

    /**
     * Getter direction
     */
    public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
        return this.#camera.direction;
    }

    /**
     * Setter direction
     */
    public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).direction: Updating Direction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).direction`, value, 'enum', true, Object.values(ORTHOGRAPHIC_CAMERA_DIRECTION));
            this.#camera.direction = value;
            this.#camera.zoomTo([], { duration: 0 });
            this.#viewer.update();
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).direction: direction was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Camera(${this.id}).direction: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (3)
}