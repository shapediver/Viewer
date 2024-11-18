import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { mat4 } from 'gl-matrix';
import { Color } from '../../types';

export interface IInstanceData extends ITreeNodeData {
    // #region Properties (2)

    instanceColors: Color[];
    instanceMatrices: mat4[];

    // #endregion Properties (2)

    // #region Public Methods (1)

    clone(): IInstanceData;

    // #endregion Public Methods (1)
}