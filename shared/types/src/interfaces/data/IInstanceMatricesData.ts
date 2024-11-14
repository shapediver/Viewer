import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { mat4 } from 'gl-matrix';

export interface IInstanceMatricesData extends ITreeNodeData {
    // #region Properties (1)

    instanceMatrices: mat4[];

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): IInstanceMatricesData;

    // #endregion Public Methods (1)
}