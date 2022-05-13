import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHT_TYPE } from '../../interface/ILight'
import { ISpotLight } from '../../interface/types/ISpotLight';
import { AbstractLight } from '../AbstractLight'

export class SpotLight extends AbstractLight implements ISpotLight {
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
      type: LIGHT_TYPE.SPOT,
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

  public get angle(): number {
    return this._angle;
  }

  public set angle(value: number) {
    this._angle = value;
    this.updateVersion();
  }

  public get decay(): number {
    return this._decay;
  }

  public set decay(value: number) {
    this._decay = value;
    this.updateVersion();
  }

  public get distance(): number {
    return this._distance;
  }

  public set distance(value: number) {
    this._distance = value;
    this.updateVersion();
  }

  public get penumbra(): number {
    return this._penumbra;
  }

  public set penumbra(value: number) {
    this._penumbra = value;
    this.updateVersion();
  }

  public get position(): vec3 {
    return this._position;
  }

  public set position(value: vec3) {
    this._position = value;
    this.updateVersion();
  }

  public get target(): vec3 {
    return this._target;
  }

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