import { ICameraEngine, OrthographicCameraControls } from "@shapediver/viewer.rendering-engine.camera-engine";

export class OrthographicControls {
  // #region Properties (9)

  private _damping: number = 0.1;
  private _enableKeyPan: boolean = false;
  private _enablePan: boolean = true;
  private _enableZoom: boolean = true;
  private _input: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } =
    { keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 } };
  private _keyPanSpeed: number = 0.5;
  private _movementSmoothness: number = 0.5;
  private _panSpeed: number = 0.5;
  private _zoomSpeed: number = 0.5;

  // #endregion Properties (9)

  // #region Constructors (1)

  constructor(private readonly _cameraEngine: ICameraEngine) {}

  // #endregion Constructors (1)

  // #region Public Accessors (18)

  /**
   * Getter damping
   * @return {number}
   */
  public get damping(): number {
    return this._damping;
  }

  /**
   * Setter damping
   * @param {number} value
   */
  public set damping(value: number) {
    (<OrthographicCameraControls>this._cameraEngine.controls).damping = value;
    this._damping = value;
  }

  /**
   * Getter enableKeyPan
   * @return {boolean}
   */
  public get enableKeyPan(): boolean {
    return this._enableKeyPan;
  }

  /**
   * Setter enableKeyPan
   * @param {boolean} value
   */
  public set enableKeyPan(value: boolean) {
    (<OrthographicCameraControls>this._cameraEngine.controls).enableKeyPan = value;
    this._enableKeyPan = value;
  }

  /**
   * Getter enablePan
   * @return {boolean}
   */
  public get enablePan(): boolean {
    return this._enablePan;
  }

  /**
   * Setter enablePan
   * @param {boolean} value
   */
  public set enablePan(value: boolean) {
    (<OrthographicCameraControls>this._cameraEngine.controls).enablePan = value;
    this._enablePan = value;
  }

  /**
   * Getter enableZoom
   * @return {boolean}
   */
  public get enableZoom(): boolean {
    return this._enableZoom;
  }

  /**
   * Setter enableZoom
   * @param {boolean} value
   */
  public set enableZoom(value: boolean) {
    (<OrthographicCameraControls>this._cameraEngine.controls).enableZoom = value;
    this._enableZoom = value;
  }

  /**
   * Getter input
   * @return {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }}
   */
  public get input(): { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } } {
    return this._input;
  }

  /**
   * Setter input
   * @param {{ keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }} value
   */
  public set input(value: { keys: { up: number, down: number, left: number, right: number }, mouse: { rotate: number, zoom: number, pan: number }, touch: { rotate: number, zoom: number, pan: number } }) {
    (<OrthographicCameraControls>this._cameraEngine.controls).input = value;
    this._input = value;
  }

  /**
   * Getter keyPanSpeed
   * @return {number}
   */
  public get keyPanSpeed(): number {
    return this._keyPanSpeed;
  }

  /**
   * Setter keyPanSpeed
   * @param {number} value
   */
  public set keyPanSpeed(value: number) {
    (<OrthographicCameraControls>this._cameraEngine.controls).keyPanSpeed = value;
    this._keyPanSpeed = value;
  }

  /**
   * Getter movementSmoothness
   * @return {number}
   */
  public get movementSmoothness(): number {
    return this._movementSmoothness;
  }

  /**
   * Setter movementSmoothness
   * @param {number} value
   */
  public set movementSmoothness(value: number) {
    (<OrthographicCameraControls>this._cameraEngine.controls).movementSmoothness = value;
    this._movementSmoothness = value;
  }

  /**
   * Getter panSpeed
   * @return {number}
   */
  public get panSpeed(): number {
    return this._panSpeed;
  }

  /**
   * Setter panSpeed
   * @param {number} value
   */
  public set panSpeed(value: number) {
    (<OrthographicCameraControls>this._cameraEngine.controls).panSpeed = value;
    this._panSpeed = value;
  }

  /**
   * Getter zoomSpeed
   * @return {number}
   */
  public get zoomSpeed(): number {
    return this._zoomSpeed;
  }

  /**
   * Setter zoomSpeed
   * @param {number} value
   */
  public set zoomSpeed(value: number) {
    (<OrthographicCameraControls>this._cameraEngine.controls).zoomSpeed = value;
    this._zoomSpeed = value;
  }

  // #endregion Public Accessors (18)
}