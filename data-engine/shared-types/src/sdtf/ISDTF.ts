import { SDTF_TYPEHINT } from "@shapediver/viewer.shared.types";

export interface ISDTF_Accessor {
    // #region Properties (2)

    bufferView: number;
    id: string;

    // #endregion Properties (2)
}

export interface ISDTF_Attribute {
    // #region Public Indexers (1)

    [key: string]: {
        typeHint: number;
        accessor?: number;
        value?: any;
    }

    // #endregion Public Indexers (1)
}
export interface ISDTF_Buffer {
    // #region Properties (2)

    byteLength: number;
    uri?: string;

    // #endregion Properties (2)
}

export interface ISDTF_BufferView {
    // #region Properties (6)

    buffer: number;
    byteLength: number;
    byteOffset: number;
    contentEncoding?: string;
    contentType: string;
    name?: string;

    // #endregion Properties (6)
}

export interface ISDTF_Chunk extends ISDTF_Node { }

export interface ISDTF_Item {
    // #region Properties (4)

    accessor?: number;
    attributes?: number;
    typeHint: number;
    value?: any;

    // #endregion Properties (4)
}

export interface ISDTF_Node {
    // #region Properties (5)

    attributes?: number;
    items: number[];
    name?: string;
    nodes?: number[];
    typeHint?: number;

    // #endregion Properties (5)
}

export interface ISDTF_TypeHint {
    // #region Properties (1)

    name: SDTF_TYPEHINT | string;

    // #endregion Properties (1)
}

export interface ISDTF {
    // #region Properties (9)

    accessors: ISDTF_Accessor[];
    attributes: ISDTF_Attribute[];
    bufferViews: ISDTF_BufferView[];
    buffers: ISDTF_Buffer[];
    chunks: ISDTF_Chunk[];
    items: ISDTF_Item[];
    nodes: ISDTF_Node[];
    typeHints: ISDTF_TypeHint[];
    version: number;

    // #endregion Properties (9)
}