import {mat4} from "gl-matrix";
import {type IBox} from "../math/IBox";
import {type IPulseEffectDefinition} from "../renderingEngine/IPulseEffectDefinition";
import {type ITreeNodeData} from "../tree-node/ITreeNodeData";
import {type IMaterialAbstractData} from "./material/IMaterialAbstractData";

export enum PRIMITIVE_MODE {
	POINTS = 0,
	LINES = 1,
	LINE_LOOP = 2,
	LINE_STRIP = 3,
	TRIANGLES = 4,
	TRIANGLE_STRIP = 5,
	TRIANGLE_FAN = 6,
}

export interface IAttributeData extends ITreeNodeData {
	// #region Properties (15)

	readonly array:
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array;
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
	readonly sparseIndices?:
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array;
	readonly sparseValues?:
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array;
	readonly target: number | undefined;

	// #endregion Properties (15)

	// #region Public Methods (1)

	clone(): IAttributeData;

	// #endregion Public Methods (1)
}

export interface IPrimitiveData extends ITreeNodeData {
	// #region Properties (3)

	readonly attributes: {
		[key: string]: IAttributeData;
	};

	boundingBox: IBox;
	indices: IAttributeData | null;

	// #endregion Properties (3)

	// #region Public Methods (2)

	clone(): IPrimitiveData;
	computeBoundingBox(matrix: mat4): IBox;

	// #endregion Public Methods (2)
}

export interface IGeometryData extends ITreeNodeData {
	// #region Properties (11)

	readonly mode: PRIMITIVE_MODE;
	readonly primitive: IPrimitiveData;

	attributeMaterial: IMaterialAbstractData | null;
	boundingBox: IBox;
	castShadow: boolean;
	effectMaterials: {material: IMaterialAbstractData; token: string}[];
	effectPulses: {effect: IPulseEffectDefinition; token: string}[];
	material: IMaterialAbstractData | null;
	materialVariants: {material: IMaterialAbstractData; variant: number}[];
	morphWeights: number[];
	receiveShadow: boolean;
	renderOrder: number;
	standardMaterial: IMaterialAbstractData | null;

	// #endregion Properties (11)

	// #region Public Methods (1)

	clone(): IGeometryData;

	// #endregion Public Methods (1)
}
