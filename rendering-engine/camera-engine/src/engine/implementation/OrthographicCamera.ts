import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE } from "../interface/ICameraEngine";
import { AbstractCamera } from "./AbstractCamera";
import { mat4, vec2, vec3 } from "gl-matrix";
import { OrthographicCameraControls } from "../../controls/implementation/OrthographicCameraControls";

export class OrthographicCamera extends AbstractCamera {
  // #region Properties (5)

  private readonly _converter: Converter = <Converter>container.resolve(Converter);

  private _bottom: number = 100;
  private _left: number = 100;
  private _right: number = 100;
  private _top: number = 100;

  // #endregion Properties (5)

  // #region Constructors (1)

  constructor(id: string, _canvas: HTMLCanvasElement) {
        super(id, CAMERATYPE.ORTHOGRAPHIC);
        this._controls = new OrthographicCameraControls(this, _canvas, true);
        const applySettings = () => {
            let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.position);
            let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.target);
            this.defaultPosition = vec3.clone(position);
            this.defaultTarget = vec3.clone(target);
            if (vec3.equals(position, target)) {
                position = vec3.fromValues(0, 1, 0);
                target = vec3.create();
            }
            this.position = position;
            this.target = target;
        };
        this._stateEngine.firstSettingsRegistered.then(() => applySettings());
    }

  // #endregion Constructors (1)

  // #region Public Accessors (8)

  /**
     * Getter bottom
     * @return {number }
     */
  public get bottom(): number {
        return this._bottom;
    }

  /**
     * Setter bottom
     * @param {number } value
     */
  public set bottom(value: number) {
        this._bottom = value;
    }

  /**
     * Getter left
     * @return {number }
     */
  public get left(): number {
        return this._left;
    }

  /**
     * Setter left
     * @param {number } value
     */
  public set left(value: number) {
        this._left = value;
    }

  /**
     * Getter right
     * @return {number }
     */
  public get right(): number {
        return this._right;
    }

  /**
     * Setter right
     * @param {number } value
     */
  public set right(value: number) {
        this._right = value;
    }

  /**
     * Getter top
     * @return {number }
     */
  public get top(): number {
        return this._top;
    }

  /**
     * Setter top
     * @param {number } value
     */
  public set top(value: number) {
        this._top = value;
    }

  // #endregion Public Accessors (8)

  // #region Public Methods (1)

  public project(pos: vec3): vec2 {
    const m = mat4.targetTo(mat4.create(), this.position, this.target, vec3.fromValues(0, 0, 1));
    const p = mat4.ortho(mat4.create(), this.left, this.right, this.bottom, this.top, this.near, this.far);
    vec3.transformMat4(pos, pos, mat4.invert(m, m))
    vec3.transformMat4(pos, pos, p)
    return vec2.fromValues(pos[0], pos[1])
  }

  // #endregion Public Methods (1)
}