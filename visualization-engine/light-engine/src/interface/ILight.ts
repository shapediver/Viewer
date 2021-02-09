import { vec3 } from 'gl-matrix'

export enum LIGHT_TYPE {
  AMBIENT = 'ambient',
  DIRECTIONAL = 'directional',
  HEMISPHERE = 'hemisphere',
  POINT = 'point',
  RECTANGLE = 'rectangle',
  SPOT = 'spot'
}

export interface ILight {
  // #region Properties (5)

  color: vec3,
  intensity: number,
  lightId: string,
  name?: string
  type: LIGHT_TYPE,

  // #endregion Properties (5)
}