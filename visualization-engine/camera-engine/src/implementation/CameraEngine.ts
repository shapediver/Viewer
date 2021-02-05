import { ICameraControls } from '../interface/ICameraControls';
import { ICameraControlsManager } from '../interface/ICameraControlsManager';
import { ICameraDefinition, ICameraEngine } from '../interface/ICameraEngine';
import { CameraControls } from './CameraControls';
import { CameraControlsManager } from './orbit/CameraControlsManager';

export class CameraEngine implements ICameraEngine{
    // #region Properties (2)

    private _cameraControls: ICameraControls;
    private _cameraControlsManager: ICameraControlsManager;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(
        private readonly _canvas: HTMLCanvasElement,
        private _cameraDefinition: ICameraDefinition
    ) {
        this._cameraControls = new CameraControls(_canvas, true, _cameraDefinition.position, _cameraDefinition.target);
        this._cameraControlsManager = new CameraControlsManager(this._cameraControls);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

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

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public update(time: number): ICameraDefinition {
        return this._cameraControls.update(time);
    }

    // #endregion Public Methods (1)
}