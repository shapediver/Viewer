import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IOutputApi } from "../IOutputApi";

export interface IOutputApiData extends ITreeNodeData {
    // #region Properties (1)

    api: IOutputApi;

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): IOutputApiData;

    // #endregion Public Methods (1)
}