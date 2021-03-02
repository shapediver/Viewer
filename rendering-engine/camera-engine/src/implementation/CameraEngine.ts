import { ICameraControls } from '../interface/ICameraControls';
import { ICameraControlsManager } from '../interface/ICameraControlsManager';
import { CAMERATYPE, ICameraDefinition, ICameraEngine } from '../interface/ICameraEngine';
import { CameraControls } from './CameraControls';
import { CameraControlsManager } from './orbit/CameraControlsManager';

export class CameraEngine implements ICameraEngine{
    // #region Properties (3)

    private readonly _type: CAMERATYPE;

    private _cameraControls: ICameraControls;
    private _cameraControlsManager: ICameraControlsManager;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(
        private readonly _canvas: HTMLCanvasElement,
        private _cameraDefinition: ICameraDefinition
    ) {
        this._type = CAMERATYPE.PERSPECTIVE;
        this._cameraControls = new CameraControls(_canvas, true, _cameraDefinition.position, _cameraDefinition.target);
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