import {ResOutput} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNodeData} from "@shapediver/viewer.shared.node-tree";

export interface ISessionOutputData extends ITreeNodeData {
	// #region Properties (1)

	responseOutput: ResOutput;

	// #endregion Properties (1)

	// #region Public Methods (1)

	clone(): ISessionOutputData;

	// #endregion Public Methods (1)
}
