import { ICameraControls } from '../../controls/interface/ICameraControls';
import { CAMERATYPE, ICameraDefinition, ICameraEngine } from '../interface/ICameraEngine';
import { vec3 } from 'gl-matrix';

export abstract class AbstractCameraEngine implements ICameraEngine{
    
    // #region Properties (3)
    protected _controls!: ICameraControls;
    protected _cameraDefinition: ICameraDefinition = {
        position: vec3.create(),
        target: vec3.create()
    };

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _type: CAMERATYPE) {}

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter controls
     * @return {ICameraControls}
     */
    public get controls(): ICameraControls {
		return this._controls;
	}

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
        this._controls.position = value.position;
        this._controls.target = value.target;
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
        return this._controls.update(time);
    }

    // #endregion Public Methods (1)
}