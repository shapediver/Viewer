import { OrthographicCamera as OrthographicCameraLogic, OrthographicCameraControls as OrthographicCameraControlsLogic  } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Camera } from "./Camera";
import { OrthographicCameraControls } from "./controls/OrthographicCameraControls";

export class OrthographicCamera extends Camera {
    // #region Properties (1)

    readonly #camera: OrthographicCameraLogic;
    readonly #controls: OrthographicCameraControls;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: OrthographicCameraLogic) {
        super(camera);
        this.#camera = camera;
        this.#controls = new OrthographicCameraControls(<OrthographicCameraControlsLogic>camera.controls)
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * The camera controls
     * @return {OrthographicCameraControls}
     */
     public get controls(): OrthographicCameraControls {
        return this.#controls;
    }

    // #endregion Public Accessors (2)
}