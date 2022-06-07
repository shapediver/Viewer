import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { SdtfTypeHintName } from '@shapediver/sdk.sdtf-v1'

export interface ISDTFAttributeData {
  // #region Properties (2)

  readonly typeHint: SdtfTypeHintName | string;
  readonly value: any;

  // #endregion Properties (2)
}

export interface ISDTFAttributesData extends ITreeNodeData {
  // #region Properties (1)

  readonly attributes: {
    [key: string]: ISDTFAttributeData
  };

  // #endregion Properties (1)

  // #region Public Methods (1)

  clone(): ISDTFAttributesData;

  // #endregion Public Methods (1)
}
