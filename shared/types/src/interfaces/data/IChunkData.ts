import {ResOutputChunk} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNodeData} from "@shapediver/viewer.shared.node-tree";

export interface IChunkData extends ITreeNodeData, ResOutputChunk {
	// #region Public Methods (1)

	clone(): IChunkData;

	// #endregion Public Methods (1)
}
