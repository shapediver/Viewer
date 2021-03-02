import { CAMERATYPE, ICameraEngine } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractCamera } from "./AbstractCamera";
import { OrthographicControls } from "./controls/OrthographicControls";

export class OrthographicCamera extends AbstractCamera {
    // #region Properties (1)

    private readonly _controls: OrthographicControls = new OrthographicControls();

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(id: string, cameraEngine: ICameraEngine) {
        super(id, cameraEngine, CAMERATYPE.ORTHOGRAPHIC);
      }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    /**
     * Getter controls
     * @return {OrthographicControls}
     */
    public get controls(): OrthographicControls {
        return this._controls;
    }

    // #endregion Public Accessors (1)
}