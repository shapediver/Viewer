import { AbstractSdtfData } from "./data/AbstractSdtfData";
import { SdtfAttributes } from "./data/attributes/SdtfAttributes";
import { SdtfNode } from "./SdtfNode";
import { SdtfTypeHint } from "./SdtfTypeHint";

export class SdtfChunk extends SdtfNode {
  // #region Constructors (1)

  constructor(
    items: AbstractSdtfData<any>[] = [],
    nodes: SdtfNode[] = [],
    attributes?: SdtfAttributes,
    name?: string,
    typeHint?: SdtfTypeHint,
  ) {
    super(items, nodes, attributes, name, typeHint);
  }

  // #endregion Constructors (1)
}