import { vec3 } from 'gl-matrix'

export enum LIGHT_TYPE {
  AMBIENT = 'ambient',
  DIRECTIONAL = 'directional',
  HEMISPHERE = 'hemisphere',
  POINT = 'point',
  RECTAREA = 'rectarea',
  SPOT = 'spot',
  FLASH = 'flash',
}

export interface ILight {
    color: vec3,
    intensity: number,
    id: string,
    type: LIGHT_TYPE,
    name?: string
}