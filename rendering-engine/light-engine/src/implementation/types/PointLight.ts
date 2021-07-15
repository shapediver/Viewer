import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHTTYPE } from '../../interface/ILight'
import { AbstractLight } from '../AbstractLight'

export class PointLight extends AbstractLight {
  // #region Properties (3)

  private _decay: number = 2;
  private _distance: number = 0;
  private _position: vec3 = vec3.fromValues(0, 0, 0);

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(properties: {
    color?: string,
    intensity?: number,
    position?: vec3,
    distance?: number,
    decay?: number,
    name?: string,
    order?: number,
    id?: string
  }) {
    super({
      color: properties.color || '#ffffff',
      intensity: properties.intensity !== undefined ? properties.intensity : 0.5,
      type: LIGHTTYPE.POINT,
      name: properties.name,
      order: properties.order,
      id: properties.id
    });
    if (properties.position) this._position = properties.position;
    if (properties.distance) this._distance = properties.distance;
    if (properties.decay) this._decay = properties.decay;
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
    this._updateCBs.forEach(v => v());
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
    this._updateCBs.forEach(v => v());
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
    this._updateCBs.forEach(v => v());
  }

  // #endregion Public Accessors (6)

  // #region Public Methods (1)

  public clone(): ITreeNodeData {
    return new PointLight({
      color: this.color,
      position: this.position,
      distance: this.distance,
      decay: this.decay,
      intensity: this.intensity,
      name: this.name,
      order: this.order
    });
  }

  // #endregion Public Methods (1)
}