import {
  PerspectiveCamera as PerspectiveCameraLogic,
  PerspectiveCameraControls as PerspectiveCameraControlsLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import { InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { IPerspectiveCameraControls } from '../../../interfaces/viewer/camera/controls/IPerspectiveCameraControls'
import { IPerspectiveCamera } from '../../../interfaces/viewer/camera/IPerspectiveCamera'
import { IViewer } from '../../../interfaces/viewer/IViewer'
import { AbstractCamera } from './AbstractCamera'
import { PerspectiveCameraControls } from './controls/PerspectiveCameraControls'

export class PerspectiveCamera extends AbstractCamera implements IPerspectiveCamera {
    // #region Properties (5)

    readonly #camera: PerspectiveCameraLogic;
    readonly #controls: IPerspectiveCameraControls;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: PerspectiveCameraLogic, viewer: IViewer) {
        super(camera, viewer);
        try {
            this.#camera = camera;
            this.#viewer = viewer;
            this.#controls = new PerspectiveCameraControls(<PerspectiveCameraControlsLogic>camera.controls, viewer);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).constructor`, e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    public get controls(): IPerspectiveCameraControls {
        return this.#controls;
    }

    public get fov(): number {
        return this.#camera.fov;
    }

    public set fov(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov: Updating Fov to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov`, value, 'positive');
            this.#camera.fov = value;
            this.#viewer.update();
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov: fov was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).fov`, e);
        }
    }

    // #endregion Public Accessors (3)
}