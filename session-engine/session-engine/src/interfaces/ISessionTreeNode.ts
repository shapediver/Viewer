import { ITreeNode } from "@shapediver/viewer.shared.node-tree";

export interface ISessionTreeNode extends ITreeNode {
    // #region Properties (1)

    readonly sessionNode: boolean;

    // #endregion Properties (1)
}