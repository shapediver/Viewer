import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IPrimitiveData } from "../IGeometryData";

export interface IMaterialVariantsData extends ITreeNodeData {
    // #region Properties (3)

    readonly primitiveData: IPrimitiveData[];
    readonly variants: string[];

    variantIndex?: number;

    // #endregion Properties (3)

    // #region Public Methods (1)

    clone(): IMaterialVariantsData;

    // #endregion Public Methods (1)
}