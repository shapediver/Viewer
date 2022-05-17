import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { GEOMETRY_TYPEHINT, PRIMITIVE_TYPEHINT } from "./ISDTFAttributesData";

export interface ISDTFOverview {
    // #region Public Indexers (1)

    [key: string]: {
        typeHint: PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string;
        count: number;
        values?: string[];
        min?: number;
        max?: number;
    }[];

    // #endregion Public Indexers (1)
};

export interface ISDTFOverviewData extends ITreeNodeData {
    // #region Properties (1)

    readonly overview: ISDTFOverview;

    // #endregion Properties (1)

    // #region Public Methods (2)

    clone(): ISDTFOverviewData;
    merge(data: ISDTFOverviewData): void;

    // #endregion Public Methods (2)
}