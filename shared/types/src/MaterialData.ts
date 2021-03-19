import { vec2, vec3, vec4 } from 'gl-matrix';
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { ISDObject } from '.';

// export interface LineMaterialDefinition {
//   // #region Properties (5)

//   dashSize: number,
//   gapSize: number,
//   lineWidth: number,
//   scale: number,
//   type: string,

//   // #endregion Properties (5)
// }

// lightReflectivity: number,
// line?: LineMaterialDefinition,

// shadowOpacity: number,
// threeDNoiseDistanceFade: number,
// threeDNoiseID: number,
// threeDNoiseOpacity: number,
// threeDNoiseScale: number,

// additionalMaps = [],
// mapPropertyColor = [],
// mapPropertyType = [],
// uvTransformAddMap = [],

export enum MATERIAL_SIDE {
  DOUBLE = 'double',
  FRONT = 'front',
  BACK = 'back'
}
export enum TEXTURE_WRAPPING {
  REPEAT = 10497,
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648
}
export enum TEXTURE_FILTERING {
  NONE = 0,
  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,
}
export enum MATERIAL_ALPHA {
  OPAQUE = 'opaque',
  MASK = 'mask',
  BLEND = 'blend'
}
export enum MATERIAL_SHADING {
  FLAT = 'flat',
  SMOOTH = 'smooth'
}

export class MapData {
  // #region Constructors (1)

  constructor(
    private readonly _image: HTMLImageElement,
    private readonly _wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
    private readonly _wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
    private readonly _minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
    private readonly _magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
    private readonly _center: vec2 = vec2.fromValues(0, 0),
    private readonly _color: vec4 = vec4.fromValues(1, 1, 1, 1),
    private readonly _offset: vec2 = vec2.fromValues(0, 0),
    private readonly _repeat: vec2 = vec2.fromValues(1, 1),
    private readonly _rotation: number = 0,
    private readonly _flipY: boolean = true,
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (10)

  /**
   * Getter center
   * @return {vec2}
   */
  public get center(): vec2 {
    return this._center;
  }

  /**
   * Getter color
   * @return {vec4}
   */
  public get color(): vec4 {
    return this._color;
  }

  /**
   * Getter image
   * @return {HTMLImageElement}
   */
  public get image(): HTMLImageElement {
    return this._image;
  }

  /**
   * Getter magFilter
   * @return {TEXTURE_FILTERING}
   */
  public get magFilter(): TEXTURE_FILTERING {
    return this._magFilter;
  }

  /**
   * Getter minFilter
   * @return {TEXTURE_FILTERING}
   */
  public get minFilter(): TEXTURE_FILTERING {
    return this._minFilter;
  }

  /**
   * Getter offset
   * @return {vec2}
   */
  public get offset(): vec2 {
    return this._offset;
  }

  /**
   * Getter repeat
   * @return {vec2}
   */
  public get repeat(): vec2 {
    return this._repeat;
  }

  /**
   * Getter rotation
   * @return {number}
   */
  public get rotation(): number {
    return this._rotation;
  }

  /**
   * Getter wrapS
   * @return {TEXTURE_WRAPPING}
   */
  public get wrapS(): TEXTURE_WRAPPING {
    return this._wrapS;
  }

  /**
   * Getter wrapT
   * @return {TEXTURE_WRAPPING}
   */
  public get wrapT(): TEXTURE_WRAPPING {
    return this._wrapT;
  }

  /**
   * Getter flipY
   * @return {boolean}
   */
  public get flipY(): boolean {
    return this._flipY;
  }

  // #endregion Public Accessors (10)
}

export class MaterialData extends AbstractTreeNodeData {
  // #region Constructors (1)

  /**
   * Creates a material data object.
   * 
   * @param _attributes the attributes of the material
   * @param id the id
   */
  constructor(
    private _alphaMap?: MapData,
    private _alphaCutoff: number = 0,
    private _alphaMode: MATERIAL_ALPHA = MATERIAL_ALPHA.OPAQUE,
    private _bumpMap?: MapData,
    private _bumpScale: number = 1.0,
    private _color?: vec4,
    private _emissiveMap?: MapData,
    private _emissiveness: vec3 = vec3.fromValues(0, 0, 0),
    private _shading: MATERIAL_SHADING = MATERIAL_SHADING.SMOOTH,
    private _map?: MapData,
    private _metalness = 1.0,
    private _metalnessMap?: MapData,
    private _metalnessRoughnessMap?: MapData,
    private _name?: string,
    private _normalMap?: MapData,
    private _normalScale: number = 1.0,
    private _opacity = 1.0,
    private _roughness = 1.0,
    private _roughnessMap?: MapData,
    private _side: MATERIAL_SIDE = MATERIAL_SIDE.DOUBLE,

    private _convertedObjects: ISDObject[] = [],
    id?: string
  ) {
    super(id);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (42)

  /**
   * Getter alphaCutoff
   * @return {number}
   */
  public get alphaCutoff(): number {
    return this._alphaCutoff;
  }

  /**
   * Setter alphaCutoff
   * @param {number} value
   */
  public set alphaCutoff(value: number) {
    this._alphaCutoff = value;
  }

  /**
   * Getter alphaMap
   * @return {MapData | undefined}
   */
  public get alphaMap(): MapData | undefined {
    return this._alphaMap;
  }

  /**
   * Setter alphaMap
   * @param {MapData | undefined} value
   */
  public set alphaMap(value: MapData | undefined) {
    this._alphaMap = value;
  }

  /**
   * Getter alphaMode
   * @return {MATERIAL_ALPHA}
   */
  public get alphaMode(): MATERIAL_ALPHA {
    return this._alphaMode;
  }

  /**
   * Setter alphaCutoff
   * @param {MATERIAL_ALPHA} value
   */
  public set alphaMode(value: MATERIAL_ALPHA) {
    this._alphaMode = value;
  }

  /**
   * Getter bumpMap
   * @return {MapData | undefined}
   */
  public get bumpMap(): MapData | undefined {
    return this._bumpMap;
  }

  /**
   * Setter bumpMap
   * @param {MapData | undefined} value
   */
  public set bumpMap(value: MapData | undefined) {
    this._bumpMap = value;
  }

  /**
   * Getter bumpScale
   * @return {number}
   */
  public get bumpScale(): number {
    return this._bumpScale;
  }

  /**
   * Setter bumpScale
   * @param {number} value
   */
  public set bumpScale(value: number) {
    this._bumpScale = value;
  }

  /**
   * Getter color
   * @return {vec4 | undefined}
   */
  public get color(): vec4 | undefined {
    return this._color;
  }

  /**
   * Setter color
   * @param {vec4 | undefined} value
   */
  public set color(value: vec4 | undefined) {
    this._color = value;
  }

  /**
   * Getter convertedObjects
   * @return {ISDObject[]}
   */
  public get convertedObjects(): ISDObject[] {
    return this._convertedObjects;
  }

  /**
   * Setter convertedObjects
   * @param {ISDObject[]} value
   */
  public set convertedObjects(value: ISDObject[]) {
    this._convertedObjects = value;
  }

  /**
   * Getter emissiveMap
   * @return {MapData | undefined}
   */
  public get emissiveMap(): MapData | undefined {
    return this._emissiveMap;
  }

  /**
   * Setter emissiveMap
   * @param {MapData | undefined} value
   */
  public set emissiveMap(value: MapData | undefined) {
    this._emissiveMap = value;
  }

  /**
   * Getter emissiveness
   * @return {vec3}
   */
  public get emissiveness(): vec3 {
    return this._emissiveness;
  }

  /**
   * Setter emissiveness
   * @param {vec3} value
   */
  public set emissiveness(value: vec3) {
    this._emissiveness = value;
  }

  /**
   * Getter map
   * @return {MapData | undefined}
   */
  public get map(): MapData | undefined {
    return this._map;
  }

  /**
   * Setter map
   * @param {MapData | undefined} value
   */
  public set map(value: MapData | undefined) {
    this._map = value;
  }

  /**
   * Getter metalness
   * @return {number}
   */
  public get metalness(): number {
    return this._metalness;
  }

  /**
   * Setter metalness
   * @param {number} value
   */
  public set metalness(value: number) {
    this._metalness = value;
  }

  /**
   * Getter metalnessMap
   * @return {MapData | undefined}
   */
  public get metalnessMap(): MapData | undefined {
    return this._metalnessMap;
  }

  /**
   * Setter metalnessMap
   * @param {MapData | undefined} value
   */
  public set metalnessMap(value: MapData | undefined) {
    this._metalnessMap = value;
  }

  /**
   * Getter metalnessRoughnessMap
   * @return {MapData | undefined}
   */
  public get metalnessRoughnessMap(): MapData | undefined {
    return this._metalnessRoughnessMap;
  }

  /**
   * Setter metalnessRoughnessMap
   * @param {MapData | undefined} value
   */
  public set metalnessRoughnessMap(value: MapData | undefined) {
    this._metalnessRoughnessMap = value;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Setter name
   * @param {string | undefined} value
   */
  public set name(value: string | undefined) {
    this._name = value;
  }

  /**
   * Getter normalMap
   * @return {MapData | undefined}
   */
  public get normalMap(): MapData | undefined {
    return this._normalMap;
  }

  /**
   * Setter normalMap
   * @param {MapData | undefined} value
   */
  public set normalMap(value: MapData | undefined) {
    this._normalMap = value;
  }

  /**
   * Getter normalScale
   * @return {number}
   */
  public get normalScale(): number {
    return this._normalScale;
  }

  /**
   * Setter normalScale
   * @param {number} value
   */
  public set normalScale(value: number) {
    this._normalScale = value;
  }

  /**
   * Getter opacity
   * @return {number}
   */
  public get opacity(): number {
    return this._opacity;
  }

  /**
   * Setter opacity
   * @param {number} value
   */
  public set opacity(value: number) {
    this._opacity = value;
  }

  /**
   * Getter roughness
   * @return {number}
   */
  public get roughness(): number {
    return this._roughness;
  }

  /**
   * Setter roughness
   * @param {number} value
   */
  public set roughness(value: number) {
    this._roughness = value;
  }

  /**
   * Getter roughnessMap
   * @return {MapData | undefined}
   */
  public get roughnessMap(): MapData | undefined {
    return this._roughnessMap;
  }

  /**
   * Setter roughnessMap
   * @param {MapData | undefined} value
   */
  public set roughnessMap(value: MapData | undefined) {
    this._roughnessMap = value;
  }

  /**
   * Getter shading
   * @return {MATERIAL_SHADING}
   */
  public get shading(): MATERIAL_SHADING {
    return this._shading;
  }

  /**
   * Setter shading
   * @param {MATERIAL_SHADING} value
   */
  public set shading(value: MATERIAL_SHADING) {
    this._shading = value;
  }

  /**
   * Getter side
   * @return {MATERIAL_SIDE}
   */
  public get side(): MATERIAL_SIDE {
    return this._side;
  }

  /**
   * Setter side
   * @param {MATERIAL_SIDE} value
   */
  public set side(value: MATERIAL_SIDE) {
    this._side = value;
  }

  // #endregion Public Accessors (42)

  // #region Public Methods (1)

  /**
   * Clones the scene graph data.
   */
  public clone(): ITreeNodeData {
    return new MaterialData(this.alphaMap, this.alphaCutoff, this.alphaMode, this.bumpMap, this.bumpScale, this.color, this.emissiveMap, this.emissiveness, this.shading, this.map, this.metalness, this.metalnessMap, this.metalnessRoughnessMap, this.name, this.normalMap, this.normalScale, this.opacity, this.roughness, this.roughnessMap, this.side, this._convertedObjects, this._id);
  }

  // #endregion Public Methods (1)
}