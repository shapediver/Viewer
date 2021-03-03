import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE, ICameraDefinition } from "../interface/ICameraEngine";
import { CameraControls } from "../../controls/implementation/CameraControls";
import { AbstractCameraEngine } from "./AbstractCameraEngine";
import { vec3 } from "gl-matrix";

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
            let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.position);
            let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.target);
            if(vec3.equals(position, target)) {
                position = vec3.fromValues(0, 1, 0);
                target = vec3.create();
            }
            this.cameraDefinition = { position, target };
        });
    }
    
    // #endregion Constructors (1)
}