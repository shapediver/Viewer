import { StateEngine, SettingsEngine } from '@shapediver/viewer.shared.services';
import { container } from 'tsyringe';
import { Converter } from '@shapediver/viewer.shared.utils';
import { ICameraControls } from '../interface/ICameraControls';
import { ICameraControlsManager } from '../interface/ICameraControlsManager';
import { CAMERATYPE, ICameraDefinition, ICameraEngine } from '../interface/ICameraEngine';
import { CameraControls } from './CameraControls';
import { CameraControlsManager } from './orbit/CameraControlsManager';
import { vec3 } from 'gl-matrix';

export class CameraEngine implements ICameraEngine{


    private readonly _stateEngine: StateEngine = container.resolve(StateEngine);
    private readonly _converter: Converter = container.resolve(Converter);
    private readonly _settingsEngine: SettingsEngine = container.resolve(SettingsEngine);
    
    // #region Properties (3)

    private _cameraControls: ICameraControls;
    private _cameraControlsManager: ICameraControlsManager;
    private _cameraDefinition: ICameraDefinition = {
        position: vec3.create(),
        target: vec3.create()
    };

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(
        private readonly _canvas: HTMLCanvasElement,
        private readonly _type: CAMERATYPE
    ) {
        this._type = CAMERATYPE.PERSPECTIVE;
        this._cameraControls = new CameraControls(_canvas, true);

        this._stateEngine.settingsRegistered.then(() => {
            this.cameraDefinition = {
                position: this._converter.toVec3(this._settingsEngine.camera.cameraTypes.perspective.default.value.position),
                target: this._converter.toVec3(this._settingsEngine.camera.cameraTypes.perspective.default.value.target)
            };
        });

        this._cameraControlsManager = new CameraControlsManager(this._cameraControls);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter cameraDefinition
     * @return {ICameraDefinition}
     */
    public get cameraDefinition(): ICameraDefinition {
		return this._cameraDefinition;
	}

    /**
     * Setter cameraDefinition
     * @param {ICameraDefinition} value
     */
    public set cameraDefinition(value: ICameraDefinition) {
		this._cameraDefinition = value;
        this._cameraControls.position = value.position;
        this._cameraControls.target = value.target;
    }

    /**
     * Getter type
     * @return {CAMERATYPE}
     */
    public get type(): CAMERATYPE {
		return this._type;
	}

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    public update(time: number): ICameraDefinition {
        return this._cameraControls.update(time);
    }

    // #endregion Public Methods (1)
}