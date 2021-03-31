import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE } from "../interface/ICameraEngine";
import { AbstractCamera } from "./AbstractCamera";
import { vec3 } from "gl-matrix";
import { OrthographicCameraControls } from "../../controls/implementation/OrthographicCameraControls";

export class OrthographicCamera extends AbstractCamera {
    // #region Properties (3)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(id: string, _canvas: HTMLCanvasElement) {
        super(id, CAMERATYPE.ORTHOGRAPHIC);
        this._controls = new OrthographicCameraControls(_canvas, true);
        const initSettings = () => {
            let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.position);
            let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.target);
            if(vec3.equals(position, target)) {
                position = vec3.fromValues(0, 1, 0);
                target = vec3.create();
            }
            this.position = position;
            this.target = target;
        };
        if(this._stateEngine.settingsRegistered.resolved === true) {
            initSettings();
        } else {
            this._stateEngine.settingsRegistered.then(() => initSettings());
        }
    }
    
    // #endregion Constructors (1)
}