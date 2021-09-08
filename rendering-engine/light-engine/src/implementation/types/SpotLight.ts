import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHTTYPE } from '../../interface/ILight'
import { AbstractLight } from '../AbstractLight'

export class SpotLight extends AbstractLight {
  // #region Properties (6)

  private _angle: number = Math.PI / 4.0;
  private _decay: number = 1;
  private _distance: number = 0;
  private _penumbra: number = 0.5;
  private _position: vec3 = vec3.fromValues(-1, 0, 1);
  private _target: vec3 = vec3.fromValues(0, 0, 0);

  // #endregion Properties (6)

  // #region Constructors (1)

  constructor(properties: {
    color?: string,
    intensity?: number,
    position?: vec3,
    target?: vec3,
    distance?: number,
    decay?: number,
    angle?: number,
    penumbra?: number,
    name?: string,
    order?: number,
    id?: string
  }) {
    super({
      color: properties.color || '#ffffff',
      intensity: properties.intensity !== undefined ? properties.intensity : 0.5,
      type: LIGHTTYPE.SPOT,
      name: properties.name,
      order: properties.order,
      id: properties.id
    });
    if (properties.position) this._position = properties.position;
    if (properties.target) this._target = properties.target;
    if (properties.distance) this._distance = properties.distance;
    if (properties.decay) this._decay = properties.decay;
    if (properties.angle) this._angle = properties.angle;
    if (properties.penumbra) this._penumbra = properties.penumbra;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (12)

  /**
   * Getter angle
   * @return {number}
   */
  public get angle(): number {
    return this._angle;
  }

  /**
   * Setter angle
   * @param {number} value
   */
  public set angle(value: number) {
    this._angle = value;
    this.updateVersion();
  }

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
   * Getter penumbra
   * @return {number}
   */
  public get penumbra(): number {
    return this._penumbra;
  }

  /**
   * Setter penumbra
   * @param {number} value
   */
  public set penumbra(value: number) {
    this._penumbra = value;
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
    this.updateVersion();
  }

  // #endregion Public Accessors (12)

  // #region Public Methods (1)

  public clone(): ITreeNodeData {
    return new SpotLight({
      color: this.color,
      position: this.position,
      target: this.target,
      distance: this.distance,
      decay: this.decay,
      angle: this.angle,
      penumbra: this.penumbra,
      intensity: this.intensity,
      name: this.name,
      order: this.order
    });
  }

  // #endregion Public Methods (1)
}