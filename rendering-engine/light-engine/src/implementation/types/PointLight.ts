import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class PointLight extends AbstractLight {
  // #region Constructors (1)

  constructor(
    color: string = '#ffffff',
    intensity: number = 0.5,
    private _position: vec3 = vec3.fromValues(0, 0, 0),
    private _distance: number = 0,
    private _decay: number = 2,
    name?: string
  ) {
    super(color, intensity, LIGHTTYPE.POINT, name);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  /**
   * Getter decay
   * @return {number}
   */
  public get decay(): number {
    return this._decay;
  }

  /**
   * Setter decay
   * @param {number} value
   */
  public set decay(value: number) {
    this._decay = value;
    this.updateVersion();
  }

  /**
   * Getter distance
   * @return {number}
   */
  public get distance(): number {
    return this._distance;
  }

  /**
   * Setter distance
   * @param {number} value
   */
  public set distance(value: number) {
    this._distance = value;
    this.updateVersion();
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
    this.updateVersion();
  }

  // #endregion Public Accessors (6)

  // #region Public Methods (1)

  public clone(): ITreeNodeData {
    return new PointLight(this.color, this.intensity, this.position, this.distance, this.decay, this.name);
  }

  // #endregion Public Methods (1)
}