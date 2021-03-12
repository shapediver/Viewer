import { PerspectiveCamera as PerspectiveCameraLogic, PerspectiveCameraControls as PerspectiveCameraControlsLogic  } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Camera } from "./Camera";
import { PerspectiveCameraControls } from "./controls/PerspectiveCameraControls";

export class PerspectiveCamera extends Camera {
    // #region Properties (1)

    readonly #camera: PerspectiveCameraLogic;
    readonly #controls: PerspectiveCameraControls;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(camera: PerspectiveCameraLogic) {
        super(camera);
        this.#camera = camera;
        this.#controls = new PerspectiveCameraControls(<PerspectiveCameraControlsLogic>camera.controls)
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter fov
     * @return {number}
     */
    public get fov(): number {
        return this.#camera.fov;
    }

    /**
     * Setter fov
     * @param {number} value
     */
    public set fov(value: number) {
        this.#camera.fov = value;
    }

    /**
     * Getter controls
     * @return {PerspectiveCameraControls}
     */
     public get controls(): PerspectiveCameraControls {
        return this.#controls;
    }

    // #endregion Public Accessors (2)
}