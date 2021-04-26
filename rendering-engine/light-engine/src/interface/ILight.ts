import { vec3 } from 'gl-matrix'

export enum LIGHTTYPE {
  AMBIENT = 'ambient',
  DIRECTIONAL = 'directional',
  HEMISPHERE = 'hemisphere',
  POINT = 'point',
  RECTANGLE = 'rectangle',
  SPOT = 'spot'
}

export interface ILight {
  // #region Properties (5)

  color: string | number | vec3,
  intensity: number,
  name?: string
  type: LIGHTTYPE,

  // #endregion Properties (5)
}