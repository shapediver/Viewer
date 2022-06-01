import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

export interface IBoneData extends ITreeNodeData {
    // #region Public Methods (1)

    clone(): IBoneData;

    // #endregion Public Methods (1)
}