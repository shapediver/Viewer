import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

export interface ICustomData extends ITreeNodeData {
    // #region Properties (1)

    data: { [key: string]: any };

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): ICustomData;

    // #endregion Public Methods (1)
}