import { AbstractCamera } from "./AbstractCamera";
import { OrbitControls } from "./controls/OrbitControls";
import { CAMERATYPE, ICameraEngine, PerspectiveCameraEngine } from "@shapediver/viewer.rendering-engine.camera-engine";

export class PerspectiveCamera extends AbstractCamera {
  // #region Properties (2)

  private readonly _controls: OrbitControls;

  private _fov: number = 800;

  // #endregion Properties (2)

  constructor(id: string, cameraEngine: ICameraEngine) {
    super(id, cameraEngine, CAMERATYPE.PERSPECTIVE);
    this._controls = new OrbitControls(cameraEngine);
  }

  // #region Public Accessors (3)

  /**
   * Getter controls
   * @return {OrbitControls}
   */
  public get controls(): OrbitControls {
    return this._controls;
  }

  /**
   * Getter fov
   * @return {number}
   */
  public get fov(): number {
    return this._fov;
  }

  /**
   * Setter fov
   * @param {number} value
   */
  public set fov(value: number) {
    (<PerspectiveCameraEngine>this._cameraEngine).fov = value;
    this._fov = value;
  }

  // #endregion Public Accessors (3)
}