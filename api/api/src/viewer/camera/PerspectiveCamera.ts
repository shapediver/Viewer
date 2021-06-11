import { PerspectiveCamera as PerspectiveCameraLogic, PerspectiveCameraControls as PerspectiveCameraControlsLogic, IPerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Camera } from "./Camera";
import { PerspectiveCameraControls } from "./controls/PerspectiveCameraControls";

export class PerspectiveCamera extends Camera implements IPerspectiveCamera {
    // #region Properties (6)

    readonly #camera: PerspectiveCameraLogic;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
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
    constructor(camera: PerspectiveCameraLogic) {
        super(camera);
        this.#camera = camera;
        this.controls = new PerspectiveCameraControls(<PerspectiveCameraControlsLogic>camera.controls);
        (<PerspectiveCameraLogic>this.#camera).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Camera frustum vertical field of view angle, unit degree, interval [0,180]
     * @param {number} value
     */
    public updateFov(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#camera.fov = value;
        this.#logger.info(`Camera (${this.#camera.id}): fov was set to: ${value}`);
    }

    // #endregion Public Methods (1)
}