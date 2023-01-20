import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { Color } from '@shapediver/viewer.shared.types'

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
  color: Color,
  intensity: number,
  name?: string
  order?: number
  type: LIGHT_TYPE,

  // #endregion Properties (5)
}