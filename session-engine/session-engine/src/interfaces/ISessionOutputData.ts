import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { ShapeDiverResponseOutput } from '@shapediver/sdk.geometry-api-sdk-v2';

export interface ISessionOutputData extends ITreeNodeData {
    // #region Properties (1)

    responseOutput: ShapeDiverResponseOutput

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): ISessionOutputData;

    // #endregion Public Methods (1)
}