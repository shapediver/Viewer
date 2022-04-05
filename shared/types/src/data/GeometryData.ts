import { mat4, vec3 } from 'gl-matrix'
import { AbstractTreeNodeData, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Box, Triangle } from '@shapediver/viewer.shared.math'
import { AbstractMaterialData } from './material/AbstractMaterialData';


export enum PRIMITIVE_MODE {
  POINTS = 0,
  LINES = 1,
  LINE_LOOP = 2,
  LINE_STRIP = 3,
  TRIANGLES = 4,
  TRIANGLE_STRIP = 5,
  TRIANGLE_FAN = 6
}

export class AttributeData {
  // #region Properties (13)

  readonly #morphAttributeData: AttributeData[] = [];
  readonly #array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
  readonly #byteOffset: number;
  readonly #byteStride?: number;
  readonly #count: number;
  readonly #elementBytes: number;
  readonly #itemBytes: number;
  readonly #itemSize: number;
  readonly #max: number[] = [];
  readonly #min: number[] = [];
  readonly #normalized: boolean;
  readonly #sparse?: boolean;
  readonly #sparseIndices?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
  readonly #sparseValues?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;

  // #endregion Properties (13)

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
    array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array,
    itemSize: number,
    itemBytes: number,
    byteOffset: number,
    elementBytes: number,
    normalized: boolean,
    count: number,
    min: number[] = [],
    max: number[] = [],
    byteStride?: number,
    sparse?: boolean,
    sparseIndices?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array,
    sparseValues?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array,
    morphAttributeData: AttributeData[] = []
  ) {
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
    this.#sparse = sparse;
    this.#sparseIndices = sparseIndices;
    this.#sparseValues = sparseValues;
    this.#morphAttributeData = morphAttributeData;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (13)

  public get array(): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array {
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

  public get morphAttributeData(): AttributeData[] {
    return this.#morphAttributeData;
  }

  public get normalized(): boolean {
    return this.#normalized;
  }

  public get sparse(): boolean | undefined {
    return this.#sparse;
  }

  public get sparseIndices(): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | undefined {
    return this.#sparseIndices;
  }

  public get sparseValues(): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | undefined {
    return this.#sparseValues;
  }

  // #endregion Public Accessors (13)

  // #region Public Methods (1)

  /**
   * Clones the attribute data.
   */
  public clone(): AttributeData {
    let array = this.#array.slice(0, this.#array.length);
    array.set(this.#array);
    return new AttributeData(
      array,
      this.#itemSize,
      this.#itemBytes,
      this.#byteOffset,
      this.#elementBytes,
      this.#normalized,
      this.#count,
      this.#min,
      this.#max,
      this.#byteStride,
      this.#sparse,
      this.#sparseIndices,
      this.#sparseValues,
      this.#morphAttributeData
    );
  }

  // #endregion Public Methods (1)
}

export class PrimitiveData {
  // #region Properties (5)

  readonly #attributes: {
    [key: string]: AttributeData
  } = {};
  readonly #mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES;

  #boundingBox: Box = new Box();
  #indices: AttributeData | null = null;
  #material: AbstractMaterialData | null = null;
  #standardMaterial: AbstractMaterialData | null = null;
  #effectMaterials: { material: AbstractMaterialData, token: string }[] = [];
  #materialVariants: { material: AbstractMaterialData, variant: number }[] = [];
  #attributeMaterial: AbstractMaterialData | null = null;

  // #endregion Properties (5)

  // #region Constructors (1)

  /**
   * Creates a primitive data object.
   * 
   * @param _attributes the attributes as key-value pairs 
   * @param _indices the indices
   */
  constructor(
    attributes: {
      [key: string]: AttributeData
    } = {},
    mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES,
    indices: AttributeData | null = null,
    material: AbstractMaterialData | null = null,
    attributeMaterial: AbstractMaterialData | null = null,
  ) {
    this.#attributes = attributes;
    this.#mode = mode;

    this.#indices = indices;
    this.#material = material;
    this.#standardMaterial = material;
    this.#attributeMaterial = attributeMaterial;

    if (this.#attributes['POSITION']) {
      if (this.#attributes['POSITION'].min.length === 3 && this.#attributes['POSITION'].max.length === 3) {
        this.#boundingBox = new Box(vec3.fromValues(this.#attributes['POSITION'].min[0], this.#attributes['POSITION'].min[1], this.#attributes['POSITION'].min[2]), vec3.fromValues(this.#attributes['POSITION'].max[0], this.#attributes['POSITION'].max[1], this.#attributes['POSITION'].max[2]));
      } else {
        this.#boundingBox.setFromAttributeArray(this.#attributes['POSITION'].array);
      }
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (7)

  public get attributes(): {
    [key: string]: AttributeData
  } {
    return this.#attributes;
  }

  public get boundingBox(): Box {
    return this.#boundingBox;
  }

  public get indices(): AttributeData | null {
    return this.#indices;
  }

  public set indices(value: AttributeData | null) {
    this.#indices = value
  }

  public get standardMaterial(): AbstractMaterialData | null {
    return this.#standardMaterial;
  }

  public set standardMaterial(value: AbstractMaterialData | null) {
    this.#standardMaterial = value;
  }

  public get material(): AbstractMaterialData | null {
    return this.#material;
  }

  public set material(value: AbstractMaterialData | null) {
    this.#material = value;
  }

  public get effectMaterials(): { material: AbstractMaterialData, token: string }[] {
    return this.#effectMaterials;
  }

  public get materialVariants(): { material: AbstractMaterialData, variant: number }[] {
    return this.#materialVariants;
  }

  public get attributeMaterial(): AbstractMaterialData | null {
    return this.#attributeMaterial;
  }

  public set attributeMaterial(value: AbstractMaterialData | null) {
    this.#attributeMaterial = value;
  }

  public get mode(): PRIMITIVE_MODE {
    return this.#mode;
  }

  // #endregion Public Accessors (7)

  // #region Public Methods (1)

  /**
   * Clones the primitive data.
   */
  public clone(): PrimitiveData {
    let attributes: {
      [key: string]: AttributeData
    } = {};
    for (let attribute in this.#attributes)
      attributes[attribute] = this.#attributes[attribute].clone();
    return new PrimitiveData(attributes, this.#mode, <AttributeData>this.#indices?.clone(), <AbstractMaterialData>this.#material?.clone(), <AbstractMaterialData>this.#attributeMaterial?.clone());
  }

  // #endregion Public Methods (1)
}

export class GeometryData extends AbstractTreeNodeData {
  // #region Properties (4)

  readonly #matrix: mat4;
  readonly #primitive: PrimitiveData;

  #boundingBox: Box = new Box();
  #renderOrder: number = 0;
  #morphWeights: number[] = [];
  #bones: TreeNode[] = [];
  #boneInverses: mat4[] = [];

  // #endregion Properties (4)

  // #region Constructors (1)

  /**
   * Creates a geometry data object.
   * 
   * @param _primitive the primitive
   * @param _matrix the matrix to apply
   * @param id the id
   */
  constructor(
    primitive: PrimitiveData,
    matrix: mat4 = mat4.create(),
    id?: string,
    morphWeights: number[] = [],
    bones: TreeNode[] = [],
    boneInverses: mat4[] = []
  ) {
    super(id);
    this.#primitive = primitive;
    this.#matrix = matrix;
    this.#boundingBox = this.primitive.boundingBox.clone();
    this.#morphWeights = morphWeights;
    this.#bones = bones;
    this.#boneInverses = boneInverses;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (5)

  public get boundingBox(): Box {
    return this.#boundingBox;
  }

  public get matrix(): mat4 {
    return this.#matrix;
  }

  public get primitive(): PrimitiveData {
    return this.#primitive;
  }

  public get renderOrder(): number {
    return this.#renderOrder;
  }

  public set renderOrder(value: number) {
    this.#renderOrder = value;
  }

  public get morphWeights(): number[] {
    return this.#morphWeights;
  }

  public set morphWeights(value: number[]) {
    this.#morphWeights = value
  }

  public get bones(): TreeNode[] {
    return this.#bones;
  }

  public set bones(value: TreeNode[]) {
    this.#bones = value
  }

  public get boneInverses(): mat4[] {
    return this.#boneInverses;
  }

  public set boneInverses(value: mat4[]) {
    this.#boneInverses = value
  }

  // #endregion Public Accessors (5)

  // #region Public Methods (2)

  /**
   * Clones the scene graph data.
   */
  public clone(): ITreeNodeData {
    return new GeometryData(this.#primitive.clone(), mat4.clone(this.matrix), this.id, this.#morphWeights, this.#bones, this.#boneInverses);
  }

  public intersect(origin: vec3, direction: vec3): number | null {
    if (this.primitive.mode !== PRIMITIVE_MODE.TRIANGLES) return null;
    return this.boundingBox.intersect(origin, direction);
  }

  // #endregion Public Methods (2)
}