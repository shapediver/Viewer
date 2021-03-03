import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE, ICameraDefinition } from "../interface/ICameraEngine";
import { CameraControls } from "../../controls/implementation/CameraControls";
import { AbstractCameraEngine } from "./AbstractCameraEngine";

export class OrthographicCameraEngine extends AbstractCameraEngine {
    // #region Properties (3)

    private readonly _converter: Converter = container.resolve(Converter);
    private readonly _settingsEngine: SettingsEngine = container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = container.resolve(StateEngine);

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(_canvas: HTMLCanvasElement) {
        super(CAMERATYPE.ORTHOGRAPHIC);
        this._controls = new CameraControls(_canvas, true, CAMERATYPE.ORTHOGRAPHIC);
        this._stateEngine.settingsRegistered.then(() => {
            this.cameraDefinition = {
                position: this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.position),
                target: this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.target)
            };
        });
    }
    
    // #endregion Constructors (1)
}