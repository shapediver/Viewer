import { IOrthographicCamera, OrthographicCamera as OrthographicCameraLogic, OrthographicCameraControls as OrthographicCameraControlsLogic  } from "@shapediver/viewer.rendering-engine.camera-engine";
import { Camera } from "./Camera";
import { OrthographicCameraControls } from "./controls/OrthographicCameraControls";

export class OrthographicCamera extends Camera implements IOrthographicCamera {
    // #region Properties (2)

    readonly #camera: OrthographicCameraLogic;
    readonly controls: OrthographicCameraControls;
    
    // #endregion Properties (2)

    // #region Constructors (1)

    /**
     * @ignore
     * @param camera 
     */
    constructor(camera: OrthographicCameraLogic) {
        super(camera);
        this.#camera = camera;
        this.controls = new OrthographicCameraControls(<OrthographicCameraControlsLogic>camera.controls)
    }

    // #endregion Constructors (1)
}