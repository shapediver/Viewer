import {
  ORTHOGRAPHIC_CAMERA_DIRECTION,
  OrthographicCamera as OrthographicCameraLogic,
  OrthographicCameraControls as OrthographicCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { IOrthographicCameraControls } from '../../../interfaces/viewer/camera/controls/IOrthographicCameraControls'
import { IOrthographicCamera } from '../../../interfaces/viewer/camera/IOrthographicCamera'
import { IViewer } from '../../../interfaces/viewer/IViewer'
import { AbstractCamera } from './AbstractCamera'
import { OrthographicCameraControls } from './controls/OrthographicCameraControls'

export class OrthographicCamera extends AbstractCamera implements IOrthographicCamera {
    // #region Properties (5)

    readonly #camera: OrthographicCameraLogic;
    readonly #controls: IOrthographicCameraControls;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: OrthographicCameraLogic, viewer: IViewer) {
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
    public get controls(): IOrthographicCameraControls {
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