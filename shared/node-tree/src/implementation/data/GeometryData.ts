import {Box, IBox} from "@shapediver/viewer.shared.math";
import {
	IAttributeData,
	IGeometryData,
	IMaterialAbstractData,
	IPrimitiveData,
	PRIMITIVE_MODE,
} from "@shapediver/viewer.shared.types";
import {mat4, quat, vec3} from "gl-matrix";
import {AbstractTreeNodeData} from "../AbstractTreeNodeData";

// #region Classes (3)

export class AttributeData
	extends AbstractTreeNodeData
	implements IAttributeData
{
	// #region Properties (15)

	readonly #array:
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array;
	readonly #byteOffset: number;
	readonly #byteStride?: number;
	readonly #count: number;
	readonly #elementBytes: number;
	readonly #itemBytes: number;
	readonly #itemSize: number;
	readonly #max: number[] = [];
	readonly #min: number[] = [];
	readonly #morphAttributeData: IAttributeData[] = [];
	readonly #normalized: boolean;
	readonly #sparse?: boolean;
	readonly #sparseIndices?:
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array;
	readonly #sparseValues?:
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array;
	readonly #target?: number;

	// #endregion Properties (15)

	// #region Constructors (1)

	/**
	 * Creates an attribute data object.
	 *
	 * @param _array the array of the data
	 * @param _itemSize the size
	 * @param _hasOffset notifier if there is an offset
	 * @param _offset the offset
	 * @param _stride the stride
	 * @param _normalized boolean if the data is normalized
	 */
	constructor(
		array:
			| Int8Array
			| Uint8Array
			| Int16Array
			| Uint16Array
			| Uint32Array
			| Float32Array,
		itemSize: number,
		itemBytes: number,
		byteOffset: number,
		elementBytes: number,
		normalized: boolean,
		count: number,
		min: number[] = [],
		max: number[] = [],
		byteStride?: number,
		target?: number,
		sparse?: boolean,
		sparseIndices?:
			| Int8Array
			| Uint8Array
			| Int16Array
			| Uint16Array
			| Uint32Array
			| Float32Array,
		sparseValues?:
			| Int8Array
			| Uint8Array
			| Int16Array
			| Uint16Array
			| Uint32Array
			| Float32Array,
		morphAttributeData: IAttributeData[] = [],
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#array = array;
		this.#itemSize = itemSize;
		this.#itemBytes = itemBytes;
		this.#byteOffset = byteOffset;
		this.#elementBytes = elementBytes;
		this.#normalized = normalized;
		this.#count = count;
		this.#min = min;
		this.#max = max;
		this.#byteStride = byteStride;
		this.#target = target;
		this.#sparse = sparse;
		this.#sparseIndices = sparseIndices;
		this.#sparseValues = sparseValues;
		this.#morphAttributeData = morphAttributeData;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (15)

	public get array():
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array {
		return this.#array;
	}

	public get byteOffset(): number {
		return this.#byteOffset;
	}

	public get byteStride(): number | undefined {
		return this.#byteStride;
	}

	public get count(): number {
		return this.#count;
	}

	public get elementBytes(): number {
		return this.#elementBytes;
	}

	public get itemBytes(): number {
		return this.#itemBytes;
	}

	public get itemSize(): number {
		return this.#itemSize;
	}

	public get max(): number[] {
		return this.#max;
	}

	public get min(): number[] {
		return this.#min;
	}

	public get morphAttributeData(): IAttributeData[] {
		return this.#morphAttributeData;
	}

	public get normalized(): boolean {
		return this.#normalized;
	}

	public get sparse(): boolean | undefined {
		return this.#sparse;
	}

	public get sparseIndices():
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array
		| undefined {
		return this.#sparseIndices;
	}

	public get sparseValues():
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Uint32Array
		| Float32Array
		| undefined {
		return this.#sparseValues;
	}

	public get target(): number | undefined {
		return this.#target;
	}

	// #endregion Public Getters And Setters (15)

	// #region Public Methods (1)

	/**
	 * Clones the attribute data.
	 */
	public clone(): IAttributeData {
		return new AttributeData(
			this.#array,
			this.#itemSize,
			this.#itemBytes,
			this.#byteOffset,
			this.#elementBytes,
			this.#normalized,
			this.#count,
			this.#min,
			this.#max,
			this.#byteStride,
			this.#target,
			this.#sparse,
			this.#sparseIndices,
			this.#sparseValues,
			this.#morphAttributeData,
			this.id,
			this.version,
		);
	}

	// #endregion Public Methods (1)
}

export class GeometryData
	extends AbstractTreeNodeData
	implements IGeometryData
{
	// #region Properties (10)

	readonly #mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES;
	readonly #primitive: IPrimitiveData;

	#attributeMaterial: IMaterialAbstractData | null = null;
	#boundingBox: IBox = new Box();
	#castShadow: boolean = true;
	#effectMaterials: {material: IMaterialAbstractData; token: string}[] = [];
	#material: IMaterialAbstractData | null = null;
	#materialVariants: {material: IMaterialAbstractData; variant: number}[] =
		[];
	#morphWeights: number[] = [];
	#receiveShadow: boolean = true;
	#renderOrder: number = 0;
	#standardMaterial: IMaterialAbstractData | null = null;

	// #endregion Properties (10)

	// #region Constructors (1)

	/**
	 * Creates a geometry data object.
	 *
	 * @param _primitive the primitive
	 * @param id the id
	 */
	constructor(
		primitive: IPrimitiveData,
		mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES,
		material: IMaterialAbstractData | null = null,
		morphWeights: number[] = [],
		attributeMaterial: IMaterialAbstractData | null = null,
		castShadow: boolean = true,
		receiveShadow: boolean = true,
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#primitive = primitive;
		this.#castShadow = castShadow;
		this.#boundingBox = this.primitive.boundingBox.clone();
		this.#morphWeights = morphWeights;
		this.#receiveShadow = receiveShadow;

		this.#mode = mode;
		this.#material = material;
		this.#standardMaterial = material;
		this.#attributeMaterial = attributeMaterial;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (15)

	public get attributeMaterial(): IMaterialAbstractData | null {
		return this.#attributeMaterial;
	}

	public set attributeMaterial(value: IMaterialAbstractData | null) {
		this.#attributeMaterial = value;
	}

	public get boundingBox(): IBox {
		return this.#boundingBox;
	}

	public get castShadow(): boolean {
		return this.#castShadow;
	}

	public set castShadow(value: boolean) {
		this.#castShadow = value;
	}

	public get effectMaterials(): {
		material: IMaterialAbstractData;
		token: string;
	}[] {
		return this.#effectMaterials;
	}

	public get material(): IMaterialAbstractData | null {
		return this.#material;
	}

	public set material(value: IMaterialAbstractData | null) {
		this.#material = value;
	}

	public get materialVariants(): {
		material: IMaterialAbstractData;
		variant: number;
	}[] {
		return this.#materialVariants;
	}

	public get mode(): PRIMITIVE_MODE {
		return this.#mode;
	}

	public get morphWeights(): number[] {
		return this.#morphWeights;
	}

	public set morphWeights(value: number[]) {
		this.#morphWeights = value;
	}

	public get primitive(): IPrimitiveData {
		return this.#primitive;
	}

	public get receiveShadow(): boolean {
		return this.#receiveShadow;
	}

	public set receiveShadow(value: boolean) {
		this.#receiveShadow = value;
	}

	public get renderOrder(): number {
		return this.#renderOrder;
	}

	public set renderOrder(value: number) {
		this.#renderOrder = value;
	}

	public get standardMaterial(): IMaterialAbstractData | null {
		return this.#standardMaterial;
	}

	public set standardMaterial(value: IMaterialAbstractData | null) {
		this.#standardMaterial = value;
	}

	// #endregion Public Getters And Setters (15)

	// #region Public Methods (2)

	/**
	 * Clones the scene graph data.
	 */
	public clone(): IGeometryData {
		return new GeometryData(
			this.#primitive,
			this.#mode,
			this.#material,
			this.#morphWeights,
			this.#attributeMaterial,
			this.#castShadow,
			this.#receiveShadow,
		);
	}

	public intersect(origin: vec3, direction: vec3): number | null {
		if (this.mode !== PRIMITIVE_MODE.TRIANGLES) return null;
		return this.boundingBox.intersect(origin, direction);
	}

	// #endregion Public Methods (2)
}

export class PrimitiveData
	extends AbstractTreeNodeData
	implements IPrimitiveData
{
	// #region Properties (3)

	readonly #attributes: {
		[key: string]: IAttributeData;
	} = {};

	#boundingBoxes: {
		matrix: mat4;
		boundingBox: IBox;
	}[] = [];
	#indices: IAttributeData | null = null;

	// #endregion Properties (3)

	// #region Constructors (1)

	/**
	 * Creates a primitive data object.
	 *
	 * @param _attributes the attributes as key-value pairs
	 * @param _indices the indices
	 */
	constructor(
		attributes: {
			[key: string]: IAttributeData;
		} = {},
		indices: IAttributeData | null = null,
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#attributes = attributes;
		this.#indices = indices;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get attributes(): {
		[key: string]: IAttributeData;
	} {
		return this.#attributes;
	}

	public get boundingBox(): IBox {
		return this.computeBoundingBox(mat4.create());
	}

	public get indices(): IAttributeData | null {
		return this.#indices;
	}

	public set indices(value: IAttributeData | null) {
		this.#indices = value;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (2)

	/**
	 * Clones the primitive data.
	 */
	public clone(): IPrimitiveData {
		const attributes: {
			[key: string]: IAttributeData;
		} = {};
		for (const attribute in this.#attributes)
			attributes[attribute] = <IAttributeData>(
				this.#attributes[attribute].clone()
			);

		return new PrimitiveData(
			attributes,
			<AttributeData>this.#indices,
			this.id,
			this.version,
		);
	}

	public computeBoundingBox(matrix: mat4): IBox {
		const res = this.#boundingBoxes.find((b) =>
			mat4.equals(matrix, b.matrix),
		);
		if (res) return res.boundingBox;

		if (this.#attributes["POSITION"]) {
			if (
				this.#attributes["POSITION"].min.length === 3 &&
				this.#attributes["POSITION"].max.length === 3 &&
				mat4.equals(matrix, mat4.create())
			) {
				const boundingBox = new Box(
					vec3.fromValues(
						this.#attributes["POSITION"].min[0],
						this.#attributes["POSITION"].min[1],
						this.#attributes["POSITION"].min[2],
					),
					vec3.fromValues(
						this.#attributes["POSITION"].max[0],
						this.#attributes["POSITION"].max[1],
						this.#attributes["POSITION"].max[2],
					),
				);
				this.#boundingBoxes.push({
					boundingBox,
					matrix: mat4.clone(matrix),
				});
				return boundingBox;
			} else if (mat4.equals(matrix, mat4.create())) {
				const boundingBox = new Box();
				boundingBox.setFromAttributeArray(
					this.#attributes["POSITION"].array,
					this.#attributes["POSITION"].byteStride,
					this.#attributes["POSITION"].itemBytes,
				);
				this.#boundingBoxes.push({
					boundingBox,
					matrix: mat4.clone(matrix),
				});
				return boundingBox;
			} else if (
				quat.equals(
					mat4.getRotation(quat.create(), matrix),
					quat.create(),
				)
			) {
				const identityBB = this.computeBoundingBox(mat4.create());
				const boundingBox = identityBB.clone().applyMatrix(matrix);
				this.#boundingBoxes.push({
					boundingBox,
					matrix: mat4.clone(matrix),
				});
				return boundingBox;
			} else {
				const boundingBox = new Box();
				boundingBox.setFromAttributeArray(
					this.#attributes["POSITION"].array,
					this.#attributes["POSITION"].byteStride,
					this.#attributes["POSITION"].itemBytes,
					matrix,
				);
				this.#boundingBoxes.push({
					boundingBox,
					matrix: mat4.clone(matrix),
				});
				return boundingBox;
			}
		}
		return new Box();
	}

	// #endregion Public Methods (2)
}

// #endregion Classes (3)
