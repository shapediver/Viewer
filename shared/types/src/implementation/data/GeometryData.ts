import { mat4, vec3 } from 'gl-matrix'
import { AbstractTreeNodeData, ITreeNode, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { Box, IBox } from '@shapediver/viewer.shared.math'
import { IAttributeData, IGeometryData, IPrimitiveData, PRIMITIVE_MODE } from '../../interfaces/data/IGeometryData';
import { IMaterialAbstractData } from '../../interfaces/data/material/IMaterialAbstractData';


export class AttributeData extends AbstractTreeNodeData implements IAttributeData {
  // #region Properties (13)

  readonly #morphAttributeData: IAttributeData[] = [];
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
    morphAttributeData: IAttributeData[] = []
  ) {
    super();
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

  public get morphAttributeData(): IAttributeData[] {
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
  public clone(): IAttributeData {
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

export class PrimitiveData extends AbstractTreeNodeData implements IPrimitiveData {
  // #region Properties (5)

  readonly #attributes: {
    [key: string]: IAttributeData
  } = {};
  readonly #mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES;

  #boundingBox: Box = new Box();
  #indices: IAttributeData | null = null;
  #material: IMaterialAbstractData | null = null;
  #standardMaterial: IMaterialAbstractData | null = null;
  #effectMaterials: { material: IMaterialAbstractData, token: string }[] = [];
  #materialVariants: { material: IMaterialAbstractData, variant: number }[] = [];
  #attributeMaterial: IMaterialAbstractData | null = null;
  #threeJsObject: { [key: string]: THREE.BufferGeometry } = {};

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
      [key: string]: IAttributeData
    } = {},
    mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES,
    indices: IAttributeData | null = null,
    material: IMaterialAbstractData | null = null,
    attributeMaterial: IMaterialAbstractData | null = null,
  ) {
    super();
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
    [key: string]: IAttributeData
  } {
    return this.#attributes;
  }

  public get boundingBox(): IBox {
    return this.#boundingBox;
  }

  public get indices(): IAttributeData | null {
    return this.#indices;
  }

  public set indices(value: IAttributeData | null) {
    this.#indices = value
  }

  public get standardMaterial(): IMaterialAbstractData | null {
    return this.#standardMaterial;
  }

  public set standardMaterial(value: IMaterialAbstractData | null) {
    this.#standardMaterial = value;
  }

  public get material(): IMaterialAbstractData | null {
    return this.#material;
  }

  public set material(value: IMaterialAbstractData | null) {
    this.#material = value;
  }

  public get effectMaterials(): { material: IMaterialAbstractData, token: string }[] {
    return this.#effectMaterials;
  }

  public get materialVariants(): { material: IMaterialAbstractData, variant: number }[] {
    return this.#materialVariants;
  }

  public get attributeMaterial(): IMaterialAbstractData | null {
    return this.#attributeMaterial;
  }

  public set attributeMaterial(value: IMaterialAbstractData | null) {
    this.#attributeMaterial = value;
  }

  public get mode(): PRIMITIVE_MODE {
    return this.#mode;
  }
  
  public get threeJsObject(): { [key: string]: THREE.BufferGeometry } {
    return this.#threeJsObject;
  }

  // #endregion Public Accessors (7)

  // #region Public Methods (1)

  /**
   * Clones the primitive data.
   */
  public clone(): IPrimitiveData {
    let attributes: {
      [key: string]: IAttributeData
    } = {};
    for (let attribute in this.#attributes)
      attributes[attribute] = <IAttributeData>this.#attributes[attribute].clone();
    return new PrimitiveData(attributes, this.#mode, <AttributeData>this.#indices?.clone(), <IMaterialAbstractData>this.#material?.clone(), <IMaterialAbstractData>this.#attributeMaterial?.clone());
  }

  // #endregion Public Methods (1)
}

export class GeometryData extends AbstractTreeNodeData implements IGeometryData {
  // #region Properties (4)

  readonly #matrix: mat4;
  readonly #primitive: IPrimitiveData;

  #boundingBox: IBox = new Box();
  #renderOrder: number = 0;
  #morphWeights: number[] = [];
  #skinNode: ITreeNode | undefined;
  #threeJsObject: { [key: string]: THREE.Mesh | THREE.Points | THREE.LineSegments | THREE.LineLoop | THREE.Line } = {};

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
    primitive: IPrimitiveData,
    matrix: mat4 = mat4.create(),
    id?: string,
    morphWeights: number[] = []
  ) {
    super(id);
    this.#primitive = primitive;
    this.#matrix = matrix;
    this.#boundingBox = this.primitive.boundingBox.clone();
    this.#morphWeights = morphWeights;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (5)

  public get boundingBox(): IBox {
    return this.#boundingBox;
  }

  public get matrix(): mat4 {
    return this.#matrix;
  }

  public get primitive(): IPrimitiveData {
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

  public get skinNode(): ITreeNode | undefined {
    return this.#skinNode;
  }

  public set skinNode(value: ITreeNode | undefined) {
    this.#skinNode = value;
  }
  
  public get threeJsObject(): { [key: string]: THREE.Mesh | THREE.Points | THREE.LineSegments | THREE.LineLoop | THREE.Line } {
    return this.#threeJsObject;
  }

  // #endregion Public Accessors (5)

  // #region Public Methods (2)

  /**
   * Clones the scene graph data.
   */
  public clone(): IGeometryData {
    return new GeometryData(this.#primitive.clone(), mat4.clone(this.matrix), this.id, this.#morphWeights);
  }

  public intersect(origin: vec3, direction: vec3): number | null {
    if (this.primitive.mode !== PRIMITIVE_MODE.TRIANGLES) return null;
    return this.boundingBox.intersect(origin, direction);
  }

  // #endregion Public Methods (2)
}