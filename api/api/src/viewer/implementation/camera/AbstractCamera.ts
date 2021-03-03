import { vec3 } from "gl-matrix";
import { AbstractCameraEngine, CAMERATYPE, ICameraEngine } from "@shapediver/viewer.rendering-engine.camera-engine";

export abstract class AbstractCamera {
  // #region Properties (9)

  private _autoAdjust: boolean = false;
  private _cameraMovementDuration: number = 800;
  private _defaultPosition: vec3 = vec3.create();
  private _defaultTarget: vec3 = vec3.create();
  private _enableCameraControls: boolean = true;
  private _revertAtMouseUp: boolean = false;
  private _revertAtMouseUpDuration: number = 800;
  private _zoomExtentsFactor: number = 1;

  // #endregion Properties (9)

  // #region Constructors (1)

  constructor(private _id: string, protected readonly _cameraEngine: ICameraEngine, protected readonly _type: CAMERATYPE) { }

  // #endregion Constructors (1)

  // #region Public Accessors (19)

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
    (<AbstractCameraEngine>this._cameraEngine).autoAdjust = value;
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
    (<AbstractCameraEngine>this._cameraEngine).cameraMovementDuration = value;
    this._cameraMovementDuration = value;
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
    (<AbstractCameraEngine>this._cameraEngine).defaultPosition = value;
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
    (<AbstractCameraEngine>this._cameraEngine).defaultTarget = value;
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
    (<AbstractCameraEngine>this._cameraEngine).enableCameraControls = value;
    this._enableCameraControls = value;
  }

  /**
     * Getter id
     * @return {string}
     */
  public get id(): string {
    return this._id;
  }

  /**
     * Setter id
     * @param {string} value
     */
  public set id(value: string) {
    this._id = value;
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
    (<AbstractCameraEngine>this._cameraEngine).revertAtMouseUp = value;
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
    (<AbstractCameraEngine>this._cameraEngine).revertAtMouseUpDuration = value;
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
    (<AbstractCameraEngine>this._cameraEngine).zoomExtentsFactor = value;
    this._zoomExtentsFactor = value;
  }

  // #endregion Public Accessors (19)
}