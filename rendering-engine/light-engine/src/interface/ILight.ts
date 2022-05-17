import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

export enum LIGHT_TYPE {
  AMBIENT = 'ambient',
  DIRECTIONAL = 'directional',
  HEMISPHERE = 'hemisphere',
  POINT = 'point',
  RECTANGLE = 'rectangle',
  SPOT = 'spot'
}

export interface ILight extends ITreeNodeData {
  // #region Properties (5)

  id: string;
  color: string | number | vec3,
  intensity: number,
  name?: string
  order?: number
  type: LIGHT_TYPE,

  // #endregion Properties (5)
}