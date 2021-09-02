import { mat4, vec3 } from 'gl-matrix'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { Box, Triangle } from '@shapediver/viewer.shared.math'

import { MaterialData } from './MaterialData'
import { ISDObject } from '.'

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
    private readonly _array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array,
    private readonly _itemSize: number,
    private readonly _itemBytes: number,
    private readonly _byteOffset: number,
    private readonly _elementBytes: number,
    private readonly _normalized: boolean,
    private readonly _count: number,
    private readonly _min: number[] = [],
    private readonly _max: number[] = [],
    private readonly _byteStride?: number,
    private readonly _sparse?: boolean,
    private readonly _sparseIndices?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array,
    private readonly _sparseValues?: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array,

  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (6)

  /**
   * Getter array
   * @return {Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array}
   */
  public get array(): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array {
    return this._array;
  }
  
  /**
   * Getter sparseIndices
   * @return {Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | undefined}
   */
   public get sparseIndices(): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | undefined {
    return this._sparseIndices;
  }
  
  /**
   * Getter sparseValues
   * @return {Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | undefined}
   */
   public get sparseValues(): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array | undefined {
    return this._sparseValues;
  }

  /**
   * Getter elementBytes
   * @return {boolean}
   */
  public get elementBytes(): number {
    return this._elementBytes;
  }

  /**
   * Getter count
   * @return {number}
   */
  public get count(): number {
    return this._count;
  }

  /**
   * Getter itemSize
   * @return {number}
   */
  public get itemSize(): number {
    return this._itemSize;
  }

  /**
   * Getter itemBytes
   * @return {number}
   */
  public get itemBytes(): number {
    return this._itemBytes;
  }

  /**
   * Getter sparse
   * @return {boolean | undefined}
   */
  public get sparse(): boolean | undefined {
    return this._sparse;
  }

  /**
   * Getter min
   * @return {number[]}
   */
  public get min(): number[] {
    return this._min;
  }

  /**
   * Getter max
   * @return {number[]}
   */
  public get max(): number[] {
    return this._max;
  }

  /**
   * Getter normalized
   * @return {boolean}
   */
  public get normalized(): boolean {
    return this._normalized;
  }

  /**
   * Getter byteOffset
   * @return {number}
   */
  public get byteOffset(): number {
    return this._byteOffset;
  }

  /**
   * Getter byteStride
   * @return {number | undefined}
   */
  public get byteStride(): number | undefined {
    return this._byteStride;
  }

  // #endregion Public Accessors (6)

  // #region Public Methods (1)

  /**
   * Clones the attribute data.
   */
  public clone(): AttributeData {
    let array = this._array.slice(0, this._array.length);
    array.set(this._array);
    return new AttributeData(
      array,
      this._itemSize,
      this._itemBytes,
      this._byteOffset,
      this._elementBytes,
      this._normalized,
      this._count,
      this._min,
      this._max,
      this._byteStride,
      this._sparse,
      this._sparseIndices,
      this._sparseValues
    );
  }

  // #endregion Public Methods (1)
}

export class PrimitiveData {
  // #region Properties (1)

  private _boundingBox: Box = new Box();

  // #endregion Properties (1)

  // #region Constructors (1)

  /**
   * Creates a primitive data object.
   * 
   * @param _attributes the attributes as key-value pairs 
   * @param _indices the indices
   */
  constructor(
    private readonly _attributes: {
      [key: string]: AttributeData
    } = {},
    private readonly _mode: PRIMITIVE_MODE = PRIMITIVE_MODE.TRIANGLES,
    private _indices: AttributeData | null = null,
    private _material: MaterialData | null = null,
  ) { 
    if(this._attributes['POSITION']) {
      if(this._attributes['POSITION'].min.length === 3 && this._attributes['POSITION'].max.length === 3) {
        this._boundingBox = new Box(vec3.fromValues(this._attributes['POSITION'].min[0], this._attributes['POSITION'].min[1], this._attributes['POSITION'].min[2]), vec3.fromValues(this._attributes['POSITION'].max[0], this._attributes['POSITION'].max[1], this._attributes['POSITION'].max[2]));
      } else {
        this._boundingBox.setFromAttributeArray(this._attributes['POSITION'].array);
      }
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (7)

  /**
   * Getter attributes
   * @return {{ [key: string]: AttributeData }}
   */
  public get attributes(): {
    [key: string]: AttributeData
  } {
    return this._attributes;
  }

  /**
   * Getter boundingBox
   * @param {Box} value
   */
  public get boundingBox(): Box {
    return this._boundingBox;
  }

  /**
   * Getter indices
   * @return {AttributeData | null}
   */
  public get indices(): AttributeData | null {
    return this._indices;
  }

  /**
   * Setter indices
   * @param {AttributeData | null} value
   */
  public set indices(value: AttributeData | null) {
    this._indices = value
  }

  /**
   * Getter material
   * @return {MaterialData | null}
   */
  public get material(): MaterialData | null {
    return this._material;
  }

  /**
   * Setter material
   * @param {MaterialData | null} value
   */
  public set material(value: MaterialData | null) {
    this._material = value;
  }

  /**
   * Getter mode
   * @return {PRIMITIVE_MODE}
   */
  public get mode(): PRIMITIVE_MODE {
    return this._mode;
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
    for(let attribute in this._attributes)
      attributes[attribute] = this._attributes[attribute].clone();
    return new PrimitiveData(attributes, this._mode, <AttributeData>this._indices?.clone(), <MaterialData>this._material?.clone());
  }

  // #endregion Public Methods (1)
}

export class GeometryData extends AbstractTreeNodeData {
  // #region Properties (1)

  private _boundingBox: Box = new Box();

  // #endregion Properties (1)

  // #region Constructors (1)

  /**
   * Creates a geometry data object.
   * 
   * @param _primitive the primitive
   * @param _matrix the matrix to apply
   * @param id the id
   */
  constructor(
    private readonly _primitive: PrimitiveData,
    private readonly _matrix: mat4 = mat4.create(),
    id?: string
  ) {
    super(id);
    this._boundingBox = this.primitive.boundingBox.clone();
  }

  // #endregion Constructors (1)

  // #region Public Accessors (5)

  /**
   * Getter boundingBox
   * @param {Box} value
   */
  public get boundingBox(): Box {
    return this._boundingBox;
  }

  /**
   * Getter matrix
   * @return {mat4}
   */
  public get matrix(): mat4 {
    return this._matrix;
  }

  /**
   * Getter primitive
   * @return {PrimitiveData}
   */
  public get primitive(): PrimitiveData {
    return this._primitive;
  }

  // #endregion Public Accessors (5)

  // #region Public Methods (1)

  public intersect(origin: vec3, direction: vec3): number | null {
    if(this.primitive.mode !== PRIMITIVE_MODE.TRIANGLES) return null;
    return this.boundingBox.intersect(origin, direction);
  }

  /**
   * Clones the scene graph data.
   */
  public clone(): ITreeNodeData {
    return new GeometryData(this._primitive.clone(), mat4.clone(this.matrix), this._id);
  }

  // #endregion Public Methods (1)
}