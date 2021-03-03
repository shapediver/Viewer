import { ICameraControls } from '../../controls/interface/ICameraControls';
import { CAMERATYPE, ICameraDefinition, ICameraEngine } from '../interface/ICameraEngine';
import { vec3 } from 'gl-matrix';

export abstract class AbstractCameraEngine implements ICameraEngine {
    // #region Properties (10)

    private _autoAdjust: boolean = false;
    private _cameraMovementDuration: number = 800;
    private _defaultPosition: vec3 = vec3.create();
    private _defaultTarget: vec3 = vec3.create();
    private _enableCameraControls: boolean = true;
    private _revertAtMouseUp: boolean = false;
    private _revertAtMouseUpDuration: number = 800;
    private _zoomExtentsFactor: number = 1;

    protected _cameraDefinition: ICameraDefinition = {
        position: vec3.create(),
        target: vec3.create()
    };
    protected _controls!: ICameraControls;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(private readonly _type: CAMERATYPE) { }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

    /**
     * Getter autoAdjust
     * @return {boolean}
     */
    public get autoAdjust(): boolean {
        return this._autoAdjust;
    }

    /**
     * Setter autoAdjust
     * @param {boolean} value
     */
    public set autoAdjust(value: boolean) {
        this._autoAdjust = value;
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
     * Getter cameraMovementDuration
     * @return {number}
     */
    public get cameraMovementDuration(): number {
        return this._cameraMovementDuration;
    }

    /**
     * Setter cameraMovementDuration
     * @param {number} value
     */
    public set cameraMovementDuration(value: number) {
        this._cameraMovementDuration = value;
    }

    /**
     * Getter controls
     * @return {ICameraControls}
     */
    public get controls(): ICameraControls {
        return this._controls;
    }

    /**
     * Getter defaultPosition
     * @return {vec3}
     */
    public get defaultPosition(): vec3 {
        return this._defaultPosition;
    }

    /**
     * Setter defaultPosition
     * @param {vec3} value
     */
    public set defaultPosition(value: vec3) {
        this._defaultPosition = value;
    }

    /**
     * Getter defaultTarget
     * @return {vec3}
     */
    public get defaultTarget(): vec3 {
        return this._defaultTarget;
    }

    /**
     * Setter defaultTarget
     * @param {vec3} value
     */
    public set defaultTarget(value: vec3) {
        this._defaultTarget = value;
    }

    /**
     * Getter enableCameraControls
     * @return {boolean}
     */
    public get enableCameraControls(): boolean {
        return this._enableCameraControls;
    }

    /**
     * Setter enableCameraControls
     * @param {boolean} value
     */
    public set enableCameraControls(value: boolean) {
        this._enableCameraControls = value;
    }

    /**
     * Getter revertAtMouseUp
     * @return {boolean}
     */
    public get revertAtMouseUp(): boolean {
        return this._revertAtMouseUp;
    }

    /**
     * Setter revertAtMouseUp
     * @param {boolean} value
     */
    public set revertAtMouseUp(value: boolean) {
        this._revertAtMouseUp = value;
    }

    /**
     * Getter revertAtMouseUpDuration
     * @return {number}
     */
    public get revertAtMouseUpDuration(): number {
        return this._revertAtMouseUpDuration;
    }

    /**
     * Setter revertAtMouseUpDuration
     * @param {number} value
     */
    public set revertAtMouseUpDuration(value: number) {
        this._revertAtMouseUpDuration = value;
    }

    /**
     * Getter type
     * @return {CAMERATYPE}
     */
    public get type(): CAMERATYPE {
        return this._type;
    }

    /**
     * Getter zoomExtentsFactor
     * @return {number}
     */
    public get zoomExtentsFactor(): number {
        return this._zoomExtentsFactor;
    }

    /**
     * Setter zoomExtentsFactor
     * @param {number} value
     */
    public set zoomExtentsFactor(value: number) {
        this._zoomExtentsFactor = value;
    }

    // #endregion Public Accessors (20)

    // #region Public Methods (1)

    public update(time: number): ICameraDefinition {
        return this._controls.update(time);
    }

    // #endregion Public Methods (1)
}