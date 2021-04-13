import { ICameraControls } from '../../controls/interface/ICameraControls';
import { ICamera } from '../interface/ICamera';
import { mat4, vec3 } from 'gl-matrix';
import { CAMERATYPE } from '../interface/ICameraEngine';
import { AbstractCameraControls } from '../../controls/implementation/AbstractCameraControls';
import { SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services';
import { container } from 'tsyringe';

export abstract class AbstractCamera implements ICamera {
    // #region Properties (15)

    protected readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    protected readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    private _autoAdjust: boolean = false;
    private _cameraMovementDuration: number = 800;
    private _defaultPosition: vec3 = vec3.create();
    private _defaultTarget: vec3 = vec3.create();
    private _enableCameraControls: boolean = true;
    private _far: number = 1000;
    private _near: number = 1;
    private _revertAtMouseUp: boolean = false;
    private _revertAtMouseUpDuration: number = 800;
    private _zoomExtentsFactor: number = 1;

    protected _controls!: AbstractCameraControls;
    protected _position: vec3 = vec3.create();
    protected _target: vec3 = vec3.create();

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(private readonly _id: string, private readonly _type: CAMERATYPE) {
        if (this._stateEngine.firstSettingsRegistered.resolved === true) {
            this.applySettings();
        } else {
            this._stateEngine.firstSettingsRegistered.then(() => this.applySettings());
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (27)

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
     * Getter far
     * @return {number }
     */
    public get far(): number {
        return this._far;
    }

    /**
     * Setter far
     * @param {number } value
     */
    public set far(value: number) {
        this._far = value;
    }

    /**
       * Getter id
       * @return {string}
       */
    public get id(): string {
        return this._id;
    }

    /**
     * Getter near
     * @return {number }
     */
    public get near(): number {
        return this._near;
    }

    /**
     * Setter near
     * @param {number } value
     */
    public set near(value: number) {
        this._near = value;
    }

    /**
     * Getter position
     * @return {vec3}
     */
    public get position(): vec3 {
        return this._position;
    }

    /**
     * Setter position
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this._position = value;
        this._controls.position = value;
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
     * Getter target
     * @return {vec3}
     */
    public get target(): vec3 {
        return this._target;
    }

    /**
     * Setter target
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this._target = value;
        this._controls.target = value;
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

    // #endregion Public Accessors (27)

    // #region Public Methods (1)

    public update(time: number): {
        position: vec3,
        target: vec3
    } {
        const { position, target } = this._controls.update(time);
        this.position = vec3.clone(position);
        this.target = vec3.clone(target);
        return { position, target };
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private applySettings() {
        this.autoAdjust = this._settingsEngine.camera.autoAdjust.value;
        this.cameraMovementDuration = this._settingsEngine.camera.cameraMovementDuration.value;
        this.enableCameraControls = this._settingsEngine.camera.enableCameraControls.value;
        this.revertAtMouseUp = this._settingsEngine.camera.revertAtMouseUp.value;
        this.revertAtMouseUpDuration = this._settingsEngine.camera.revertAtMouseUpDuration.value;
        this.zoomExtentsFactor = this._settingsEngine.camera.zoomExtentsFactor.value;
    }

    // #endregion Private Methods (1)
}