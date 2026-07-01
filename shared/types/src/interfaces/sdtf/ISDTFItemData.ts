import {SdtfTypeHintName} from "@shapediver/sdk.sdtf-v1";
import {type ITreeNodeData} from "../tree-node/ITreeNodeData";
import {type ISDTFAttributeData} from "./ISDTFAttributesData";

export interface ISDTFItemData extends ITreeNodeData {
	// #region Properties (3)

	readonly attributes: {
		[key: string]: ISDTFAttributeData;
	};

	readonly typeHint: SdtfTypeHintName | string;
	readonly value: any;

	// #endregion Properties (3)

	// #region Public Methods (1)

	clone(): ISDTFItemData;

	// #endregion Public Methods (1)
}
