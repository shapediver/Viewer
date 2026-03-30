import {mat4} from "gl-matrix";
import {Color} from "../../types";
import {ITreeNodeData} from "../tree-node/ITreeNodeData";

export interface IInstanceData extends ITreeNodeData {
	// #region Properties (2)

	instanceColors: Color[];
	instanceMatrices: mat4[];

	// #endregion Properties (2)

	// #region Public Methods (1)

	clone(): IInstanceData;

	// #endregion Public Methods (1)
}
