import {ITreeNodeData} from "../../tree-node/ITreeNodeData";
import {IGeometryData} from "../IGeometryData";

export interface IMaterialVariantsData extends ITreeNodeData {
	// #region Properties (3)

	readonly geometryData: IGeometryData[];
	readonly variants: string[];

	variantIndex?: number;

	// #endregion Properties (3)

	// #region Public Methods (1)

	clone(): IMaterialVariantsData;

	// #endregion Public Methods (1)
}
