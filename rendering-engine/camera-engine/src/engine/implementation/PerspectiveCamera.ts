import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE } from "../interface/ICameraEngine";
import { AbstractCamera } from "./AbstractCamera";
import { mat4, vec2, vec3 } from "gl-matrix";
import { PerspectiveCameraControls } from "../../controls/implementation/PerspectiveCameraControls";

export class PerspectiveCamera extends AbstractCamera {
  // #region Properties (3)

  private readonly _converter: Converter = <Converter>container.resolve(Converter);

  private _aspect: number = 60;
  private _fov: number = 60;

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(id: string, _canvas: HTMLCanvasElement) {
    super(id, CAMERATYPE.PERSPECTIVE);
    this._controls = new PerspectiveCameraControls(this, _canvas, true);
    const applySettings = () => {
      let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.perspective.default.value.position);
      let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.perspective.default.value.target);
      this.defaultPosition = vec3.clone(position);
      this.defaultTarget = vec3.clone(target);
      if (vec3.equals(position, target)) {
        position = vec3.fromValues(0, 1, 0);
        target = vec3.create();
      }
      this.position = position;
      this.target = target;
      this.fov = this._settingsEngine.camera.cameraTypes.perspective.fov.value;
    };
    this._stateEngine.firstSettingsRegistered.then(() => applySettings());
  }

  // #endregion Constructors (1)

  // #region Public Accessors (4)

  /**
   * Getter aspect
   * @return {number }
   */
  public get aspect(): number {
    return this._aspect;
  }

  /**
   * Setter aspect
   * @param {number } value
   */
  public set aspect(value: number) {
    this._aspect = value;
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
    this._fov = value;
  }

  // #endregion Public Accessors (4)

  // #region Public Methods (1)

  public project(pos: vec3): vec2 {
    const m = mat4.targetTo(mat4.create(), this.position, this.target, vec3.fromValues(0, 0, 1));
    const p = mat4.perspective(mat4.create(), this.fov / (180/Math.PI), this.aspect, this.near, this.far);
    vec3.transformMat4(pos, pos, mat4.invert(m, m))
    vec3.transformMat4(pos, pos, p)
    return vec2.fromValues(pos[0], pos[1])
  }

  // #endregion Public Methods (1)
}