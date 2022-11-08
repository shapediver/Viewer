import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHT_TYPE } from '../../interface/ILight'
import { ISpotLight } from '../../interface/types/ISpotLight';
import { AbstractLight } from '../AbstractLight'

export class SpotLight extends AbstractLight implements ISpotLight {
  // #region Properties (6)

  #angle: number = Math.PI / 4.0;
  #decay: number = 0;
  #distance: number = 0;
  #penumbra: number = 0.5;
  #position: vec3 = vec3.fromValues(-1, 0, 1);
  #target: vec3 = vec3.fromValues(0, 0, 0);
  #threeJsObject: { [key: string]: THREE.SpotLight } = {};

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
      intensity: properties.intensity !== undefined ? properties.intensity : 1,
      type: LIGHT_TYPE.SPOT,
      name: properties.name,
      order: properties.order,
      id: properties.id
    });
    if (properties.position) this.#position = properties.position;
    if (properties.target) this.#target = properties.target;
    if (properties.distance) this.#distance = properties.distance;
    if (properties.decay) this.#decay = properties.decay;
    if (properties.angle) this.#angle = properties.angle;
    if (properties.penumbra) this.#penumbra = properties.penumbra;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (12)

  public get angle(): number {
    return this.#angle;
  }

  public set angle(value: number) {
    this.#angle = value;
    this.updateVersion();
  }

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

  public get penumbra(): number {
    return this.#penumbra;
  }

  public set penumbra(value: number) {
    this.#penumbra = value;
    this.updateVersion();
  }

  public get position(): vec3 {
    return this.#position;
  }

  public set position(value: vec3) {
    this.#position = value;
    this.updateVersion();
  }

  public get target(): vec3 {
    return this.#target;
  }

  public set target(value: vec3) {
    this.#target = value;
    this.updateVersion();
  }

  public get threeJsObject(): { [key: string]: THREE.SpotLight } {
      return this.#threeJsObject;
  }

  // #endregion Public Accessors (12)

  // #region Public Methods (1)

  public clone(): ISpotLight {
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