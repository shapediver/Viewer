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
    private readonly _color?: string,
    private readonly _offset: vec2 = vec2.fromValues(0, 0),
    private readonly _repeat: vec2 = vec2.fromValues(1, 1),
    private readonly _rotation: number = 0,
    private readonly _flipY: boolean = true,
  ) { }

  // #endregion Constructors (1)

  // #region Public Accessors (11)

  /**
   * Getter center
   * @return {vec2}
   */
  public get center(): vec2 {
    return this._center;
  }

  /**
   * Getter color
   * @return {string | undefined}
   */
  public get color(): string | undefined {
    return this._color;
  }

  /**
   * Getter flipY
   * @return {boolean}
   */
  public get flipY(): boolean {
    return this._flipY;
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

  // #endregion Public Accessors (11)

  // #region Public Methods (1)

  public clone(): MapData {
    return new MapData(<HTMLImageElement>this.image.cloneNode(), this.wrapS, this.wrapT, this.minFilter, this.magFilter, this.center, this.color, this.offset, this.repeat, this.rotation, this.flipY);
  }

  // #endregion Public Methods (1)
}

export class MaterialData extends AbstractTreeNodeData {
  // #region Properties (29)

  private _alphaCutoff: number = 0;
  private _alphaMap?: MapData;
  private _alphaMode: MATERIAL_ALPHA = MATERIAL_ALPHA.OPAQUE;
  private _aoMap?: MapData;
  private _aoMapIntensity: number = 1.0;
  private _bumpMap?: MapData;
  private _bumpScale: number = 1.0;
  private _color?: string;
  private _convertedObjects: ISDObject[] = [];
  private _emissiveMap?: MapData;
  private _emissiveness?: string;
  private _glossiness: number = 1;
  private _glossinessMap?: MapData;
  private _map?: MapData;
  private _metalness = 1.0;
  private _metalnessMap?: MapData;
  private _metalnessRoughnessMap?: MapData;
  private _name?: string;
  private _normalMap?: MapData;
  private _normalScale: number = 1.0;
  private _opacity = 1.0;
  private _roughness = 1.0;
  private _roughnessMap?: MapData;
  private _shading: MATERIAL_SHADING = MATERIAL_SHADING.SMOOTH;
  private _side: MATERIAL_SIDE = MATERIAL_SIDE.DOUBLE;
  private _specular: string = '#ffffff';
  private _specularGlossinessMap?: MapData;
  private _KHR_materials_pbrSpecularGlossiness: boolean = false;
  private _KHR_materials_unlit: boolean = false;
  private _specularMap?: MapData;

  // #endregion Properties (29)

  // #region Constructors (1)

  /**
   * Creates a material data object.
   * 
   * @param _attributes the attributes of the material
   * @param id the id
   */
  constructor(
    properties?: {
      alphaMap?: MapData,
      alphaCutoff?: number,
      alphaMode?: MATERIAL_ALPHA,
      aoMap?: MapData,
      aoMapIntensity?: number,
      bumpMap?: MapData,
      bumpScale?: number,
      color?: string,
      emissiveMap?: MapData,
      emissiveness?: string,
      shading?: MATERIAL_SHADING,
      map?: MapData,
      metalness?: number,
      metalnessMap?: MapData,
      metalnessRoughnessMap?: MapData,
      name?: string,
      normalMap?: MapData,
      normalScale?: number,
      opacity?: number,
      roughness?: number,
      roughnessMap?: MapData,
      side?: MATERIAL_SIDE,
      KHR_materials_pbrSpecularGlossiness?: boolean,
      KHR_materials_unlit?: boolean,
      glossiness?: number,
      specular?: string,
      specularGlossinessMap?: MapData,
      specularMap?: MapData,
      glossinessMap?: MapData,
      convertedObjects?: ISDObject[]
    },
    id?: string
  ) {
    super(id);
    if(!properties) return;
    if(properties.alphaMap !== undefined) this.alphaMap = properties.alphaMap;
    if(properties.alphaCutoff !== undefined) this.alphaCutoff = properties.alphaCutoff;
    if(properties.alphaMode !== undefined) this.alphaMode = properties.alphaMode;
    if(properties.aoMap !== undefined) this.aoMap = properties.aoMap;
    if(properties.aoMapIntensity !== undefined) this.aoMapIntensity = properties.aoMapIntensity;
    if(properties.bumpMap !== undefined) this.bumpMap = properties.bumpMap;
    if(properties.bumpScale !== undefined) this.bumpScale = properties.bumpScale;
    if(properties.color !== undefined) this.color = properties.color;
    if(properties.emissiveMap !== undefined) this.emissiveMap = properties.emissiveMap;
    if(properties.emissiveness !== undefined) this.emissiveness = properties.emissiveness;
    if(properties.shading !== undefined) this.shading = properties.shading;
    if(properties.map !== undefined) this.map = properties.map;
    if(properties.metalness !== undefined) this.metalness = properties.metalness;
    if(properties.metalnessMap !== undefined) this.metalnessMap = properties.metalnessMap;
    if(properties.metalnessRoughnessMap !== undefined) this.metalnessRoughnessMap = properties.metalnessRoughnessMap;
    if(properties.name !== undefined) this.name = properties.name;
    if(properties.normalMap !== undefined) this.normalMap = properties.normalMap;
    if(properties.normalScale !== undefined) this.normalScale = properties.normalScale;
    if(properties.opacity !== undefined) this.opacity = properties.opacity;
    if(properties.roughness !== undefined) this.roughness = properties.roughness;
    if(properties.roughnessMap !== undefined) this.roughnessMap = properties.roughnessMap;
    if(properties.side !== undefined) this.side = properties.side;
    if(properties.KHR_materials_pbrSpecularGlossiness !== undefined) this.KHR_materials_pbrSpecularGlossiness = properties.KHR_materials_pbrSpecularGlossiness;
    if(properties.KHR_materials_unlit !== undefined) this.KHR_materials_unlit = properties.KHR_materials_unlit;
    if(properties.glossiness !== undefined) this.glossiness = properties.glossiness;
    if(properties.specular !== undefined) this.specular = properties.specular;
    if(properties.specularGlossinessMap !== undefined) this.specularGlossinessMap = properties.specularGlossinessMap;
    if(properties.specularMap !== undefined) this.specularMap = properties.specularMap;
    if(properties.glossinessMap !== undefined) this.glossinessMap = properties.glossinessMap;
    if(properties.convertedObjects !== undefined) this.convertedObjects = properties.convertedObjects;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (58)

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
   * Getter aoMap
   * @return {MapData | undefined}
   */
  public get aoMap(): MapData | undefined {
    return this._aoMap;
  }

  /**
   * Setter aoMap
   * @param {MapData | undefined} value
   */
  public set aoMap(value: MapData | undefined) {
    this._aoMap = value;
  }

  /**
   * Getter aoMapIntensity
   * @return {number}
   */
  public get aoMapIntensity(): number {
    return this._aoMapIntensity;
  }

  /**
   * Setter aoMapIntensity
   * @param {number} value
   */
  public set aoMapIntensity(value: number) {
    this._aoMapIntensity = value;
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
   * @return {string | undefined}
   */
  public get color(): string | undefined {
    return this._color;
  }

  /**
   * Setter color
   * @param {string | undefined} value
   */
  public set color(value: string | undefined) {
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
   * @return {string | undefined}
   */
  public get emissiveness(): string | undefined {
    return this._emissiveness;
  }

  /**
   * Setter emissiveness
   * @param {string | undefined} value
   */
  public set emissiveness(value: string | undefined) {
    this._emissiveness = value;
  }

  /**
   * Getter glossiness
   * @return {number}
   */
  public get glossiness(): number {
    return this._glossiness;
  }

  /**
   * Setter glossiness
   * @param {number} value
   */
  public set glossiness(value: number) {
    this._glossiness = value;
  }

  /**
   * Getter glossinessMap
   * @return {MapData | undefined}
   */
  public get glossinessMap(): MapData | undefined {
    return this._glossinessMap;
  }

  /**
   * Setter glossinessMap
   * @param {MapData | undefined} value
   */
  public set glossinessMap(value: MapData | undefined) {
    this._glossinessMap = value;
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

  /**
   * Getter specular
   * @return {string}
   */
  public get specular(): string {
    return this._specular;
  }

  /**
   * Setter specular
   * @param {string} value
   */
  public set specular(value: string) {
    this._specular = value;
  }

  /**
   * Getter specularGlossinessMap
   * @return {MapData | undefined}
   */
  public get specularGlossinessMap(): MapData | undefined {
    return this._specularGlossinessMap;
  }

  /**
   * Setter specularGlossinessMap
   * @param {MapData | undefined} value
   */
  public set specularGlossinessMap(value: MapData | undefined) {
    this._specularGlossinessMap = value;
  }

  /**
   * Getter KHR_materials_pbrSpecularGlossiness
   * @return {boolean}
   */
  public get KHR_materials_pbrSpecularGlossiness(): boolean {
    return this._KHR_materials_pbrSpecularGlossiness;
  }

  /**
   * Setter KHR_materials_pbrSpecularGlossiness
   * @param {boolean} value
   */
  public set KHR_materials_pbrSpecularGlossiness(value: boolean) {
    this._KHR_materials_pbrSpecularGlossiness = value;
  }

  /**
   * Getter KHR_materials_unlit
   * @return {boolean}
   */
  public get KHR_materials_unlit(): boolean {
    return this._KHR_materials_unlit;
  }

  /**
   * Setter KHR_materials_unlit
   * @param {boolean} value
   */
  public set KHR_materials_unlit(value: boolean) {
    this._KHR_materials_unlit = value;
  }

  /**
   * Getter specularMap
   * @return {MapData | undefined}
   */
  public get specularMap(): MapData | undefined {
    return this._specularMap;
  }

  /**
   * Setter specularMap
   * @param {MapData | undefined} value
   */
  public set specularMap(value: MapData | undefined) {
    this._specularMap = value;
  }

  // #endregion Public Accessors (58)

  // #region Public Methods (1)

  /**
   * Clones the scene graph data.
   */
  public clone(): ITreeNodeData {
    return new MaterialData({
      alphaMap: this.alphaMap,
      alphaCutoff: this.alphaCutoff,
      alphaMode: this.alphaMode,
      aoMap: this.aoMap,
      aoMapIntensity: this.aoMapIntensity,
      bumpMap: this.bumpMap,
      bumpScale: this.bumpScale,
      color: this.color,
      emissiveMap: this.emissiveMap,
      emissiveness: this.emissiveness,
      shading: this.shading,
      map: this.map,
      metalness: this.metalness,
      metalnessMap: this.metalnessMap,
      metalnessRoughnessMap: this.metalnessRoughnessMap,
      name: this.name,
      normalMap: this.normalMap,
      normalScale: this.normalScale,
      opacity: this.opacity,
      roughness: this.roughness,
      roughnessMap: this.roughnessMap,
      side: this.side,
      KHR_materials_pbrSpecularGlossiness: this.KHR_materials_pbrSpecularGlossiness,
      KHR_materials_unlit: this.KHR_materials_unlit,
      specular: this.specular,
      specularMap: this.specularMap,
      specularGlossinessMap: this.specularGlossinessMap,
      glossiness: this.glossiness,
      glossinessMap: this.glossinessMap,
      convertedObjects: this.convertedObjects,
    }, this.id);
  }

  // #endregion Public Methods (1)
}