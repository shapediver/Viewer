import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHT_TYPE } from '../../interface/ILight'
import { IPointLight } from '../../interface/types/IPointLight';
import { AbstractLight } from '../AbstractLight'

export class PointLight extends AbstractLight implements IPointLight {
  // #region Properties (3)

  #decay: number = 0;
  #distance: number = 0;
  #position: vec3 = vec3.fromValues(0, 0, 0);
  #threeJsObject: { [key: string]: THREE.PointLight } = {};

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
      intensity: properties.intensity !== undefined ? properties.intensity : 1,
      type: LIGHT_TYPE.POINT,
      name: properties.name,
      order: properties.order,
      id: properties.id
    });
    if (properties.position) this.#position = properties.position;
    if (properties.distance) this.#distance = properties.distance;
    if (properties.decay) this.#decay = properties.decay;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  public get decay(): number {
    return this.#decay;
  }

  public set decay(value: number) {
    this.#decay = value;
    this.updateVersion();
  }

  public get distance(): number {
    return this.#distance;
  }

  public set distance(value: number) {
    this.#distance = value;
    this.updateVersion();
  }

  public get position(): vec3 {
    return this.#position;
  }

  public set position(value: vec3) {
    this.#position = value;
    this.updateVersion();
  }

  public get threeJsObject(): { [key: string]: THREE.PointLight } {
      return this.#threeJsObject;
  }

  // #endregion Public Accessors (6)

  // #region Public Methods (1)

  public clone(): IPointLight {
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