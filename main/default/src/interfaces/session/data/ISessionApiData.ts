import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { ISessionApi } from "../ISessionApi";

export interface ISessionApiData extends ITreeNodeData {
    // #region Properties (1)

    api: ISessionApi;

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): ISessionApiData;

    // #endregion Public Methods (1)
}