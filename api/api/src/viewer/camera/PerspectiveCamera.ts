import { PerspectiveCamera as PerspectiveCameraLogic, PerspectiveCameraControls as PerspectiveCameraControlsLogic  } from "@shapediver/viewer.rendering-engine.camera-engine";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Camera } from "./Camera";
import { PerspectiveCameraControls } from "./controls/PerspectiveCameraControls";

export class PerspectiveCamera extends Camera {
    // #region Properties (1)

    readonly #camera: PerspectiveCameraLogic;
    readonly #controls: PerspectiveCameraControls;
    readonly #inputValidator = <InputValidator>container.resolve(InputValidator);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: PerspectiveCameraLogic) {
        super(camera);
        this.#camera = camera;
        this.#controls = new PerspectiveCameraControls(<PerspectiveCameraControlsLogic>camera.controls)
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Camera frustum vertical field of view angle, unit degree, interval [0,180]
     * @return {number}
     */
    public get fov(): number {
        return this.#camera.fov;
    }

    /**
     * Camera frustum vertical field of view angle, unit degree, interval [0,180]
     * @param {number} value
     */
    public set fov(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#camera.fov = value;
    }

    /**
     * The camera controls
     * @return {PerspectiveCameraControls}
     */
     public get controls(): PerspectiveCameraControls {
        return this.#controls;
    }

    // #endregion Public Accessors (2)
}