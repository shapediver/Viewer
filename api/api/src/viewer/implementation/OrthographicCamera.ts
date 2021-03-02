import { CAMERATYPE } from "@shapediver/viewer.rendering-engine.camera-engine";
import { AbstractCamera } from "./AbstractCamera";
import { OrthographicControls } from "./OrthographicControls";

export class OrthographicCamera extends AbstractCamera {
    // #region Properties (1)

    private readonly _controls: OrthographicControls = new OrthographicControls();

    // #endregion Properties (1)

    constructor() {
        super(CAMERATYPE.ORTHOGRAPHIC);
    }

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