import { IOrthographicCamera, OrthographicCamera as OrthographicCameraLogic, OrthographicCameraControls as OrthographicCameraControlsLogic, ORTHOGRAPHIC_CAMERA_DIRECTION } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Logger, LOGGINGTOPIC, SDError } from "@shapediver/viewer.shared.utils";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";
import { Viewer } from "../Viewer";
import { Camera } from "./Camera";
import { OrthographicCameraControls } from "./controls/OrthographicCameraControls";

export class OrthographicCamera extends Camera implements IOrthographicCamera {
    // #region Properties (2)

    readonly #camera: OrthographicCameraLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;
    readonly #updateCB = () => {
        (<any>this.direction) = this.#camera.direction;
    }

    readonly controls: OrthographicCameraControls;
    readonly direction!: ORTHOGRAPHIC_CAMERA_DIRECTION;

    // #endregion Properties (2)

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
            this.controls = new OrthographicCameraControls(<OrthographicCameraControlsLogic>camera.controls, viewer);
            (<OrthographicCameraLogic>this.#camera).addUpdateCB(this.#updateCB);
            this.#updateCB();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, new SDError(e.message, e), `Camera(${this.id}).constructor: Something unexpected happened.`, true)
        }
    }

    /**
     * Camera frustum vertical field of view angle, unit degree, interval [0,180]
     * @param {number} value
     */
    public updateDirection(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDirection: Updating Direction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDirection`, value, 'enum', true, Object.values(ORTHOGRAPHIC_CAMERA_DIRECTION));
            this.#camera.direction = value;
            this.#camera.zoomTo([], { duration: 0 });
            this.#viewer.update();
            this.#logger.info(LOGGINGTOPIC.CAMERA, `Camera(${this.id}).updateDirection: direction was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.CAMERA, new SDError(e.message, e), `Camera(${this.id}).updateDirection: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)
}