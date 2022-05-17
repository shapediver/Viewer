import { ShapeDiverResponseDto } from "@shapediver/sdk.geometry-api-sdk-v2";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";

export interface ISessionData extends ITreeNodeData {
    // #region Properties (1)

    responseDto: ShapeDiverResponseDto;

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): ISessionData;

    // #endregion Public Methods (1)
}