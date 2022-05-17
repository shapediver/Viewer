import { ITreeNode, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IBox } from "@shapediver/viewer.shared.math";
import { IMaterialData } from "./material/IMaterialData";
import { mat4 } from "gl-matrix";

export enum PRIMITIVE_MODE {
    POINTS = 0,
    LINES = 1,
    LINE_LOOP = 2,
    LINE_STRIP = 3,
    TRIANGLES = 4,
    TRIANGLE_STRIP = 5,
    TRIANGLE_FAN = 6
}

export interface IAttributeData extends ITreeNodeData {
    // #region Properties (14)

    readonly array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
    readonly byteOffset: number;
    readonly byteStride?: number;
    readonly count: number;
    readonly elementBytes: number;
    readonly itemBytes: number;
    readonly itemSize: number;
    readonly max: number[];
    readonly min: number[];
    readonly morphAttributeData: IAttributeData[];
    readonly normalized: boolean;
    readonly sparse?: boolean;
    readonly sparseIndices?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
    readonly sparseValues?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;

    // #endregion Properties (14)

    // #region Public Methods (1)

    clone(): IAttributeData;

    // #endregion Public Methods (1)
}

export interface IPrimitiveData extends ITreeNodeData {
    // #region Properties (9)

    readonly attributes: {
        [key: string]: IAttributeData
    };
    readonly mode: PRIMITIVE_MODE;

    attributeMaterial: IMaterialData | null;
    boundingBox: IBox;
    effectMaterials: { material: IMaterialData, token: string }[];
    indices: IAttributeData | null;
    material: IMaterialData | null;
    materialVariants: { material: IMaterialData, variant: number }[];
    standardMaterial: IMaterialData | null;

    // #endregion Properties (9)

    // #region Public Methods (1)

    clone(): IPrimitiveData;

    // #endregion Public Methods (1)
}

export interface IGeometryData extends ITreeNodeData {
    // #region Properties (7)

    readonly matrix: mat4;
    readonly primitive: IPrimitiveData;

    boneInverses: mat4[];
    bones: ITreeNode[];
    boundingBox: IBox;
    morphWeights: number[];
    renderOrder: number;

    // #endregion Properties (7)

    // #region Public Methods (1)

    clone(): IGeometryData;

    // #endregion Public Methods (1)
}