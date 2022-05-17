import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { GEOMETRY_TYPEHINT, ISDTFAttributeData, PRIMITIVE_TYPEHINT } from "./ISDTFAttributesData";

export interface ISDTFItemData extends ITreeNodeData {
    // #region Properties (3)

    readonly attributes: {
        [key: string]: ISDTFAttributeData
    }

    readonly typeHint: PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string
    readonly value: any;

    // #endregion Properties (3)

    // #region Public Methods (1)

    clone(): ISDTFItemData;

    // #endregion Public Methods (1)
}
  