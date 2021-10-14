import { vec2, vec3, vec4 } from 'gl-matrix'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

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
  // #region Properties (11)

  readonly #center: vec2 = vec2.fromValues(0, 0);
  readonly #color?: string;
  readonly #flipY: boolean = true;
  readonly #image: HTMLImageElement;
  readonly #magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
  readonly #minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
  readonly #offset: vec2 = vec2.fromValues(0, 0);
  readonly #repeat: vec2 = vec2.fromValues(1, 1);
  readonly #rotation: number = 0;
  readonly #wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;
  readonly #wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;

  // #endregion Properties (11)

  // #region Constructors (1)

  constructor(
    image: HTMLImageElement,
    wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
    wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
    minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
    magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
    center: vec2 = vec2.fromValues(0, 0),
    color?: string,
    offset: vec2 = vec2.fromValues(0, 0),
    repeat: vec2 = vec2.fromValues(1, 1),
    rotation: number = 0,
    flipY: boolean = true,
  ) {
    this.#image = image;
    this.#wrapS = wrapS;
    this.#wrapT = wrapT;
    this.#minFilter = minFilter;
    this.#magFilter = magFilter;
    this.#center = center;
    this.#color = color;
    this.#offset = offset;
    this.#repeat = repeat;
    this.#rotation = rotation;
    this.#flipY = flipY;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (11)

  public get center(): vec2 {
    return this.#center;
  }

  public get color(): string | undefined {
    return this.#color;
  }

  public get flipY(): boolean {
    return this.#flipY;
  }

  public get image(): HTMLImageElement {
    return this.#image;
  }

  public get magFilter(): TEXTURE_FILTERING {
    return this.#magFilter;
  }

  public get minFilter(): TEXTURE_FILTERING {
    return this.#minFilter;
  }

  public get offset(): vec2 {
    return this.#offset;
  }

  public get repeat(): vec2 {
    return this.#repeat;
  }

  public get rotation(): number {
    return this.#rotation;
  }

  public get wrapS(): TEXTURE_WRAPPING {
    return this.#wrapS;
  }

  public get wrapT(): TEXTURE_WRAPPING {
    return this.#wrapT;
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

  #KHR_materials_pbrSpecularGlossiness: boolean = false;
  #KHR_materials_unlit: boolean = false;
  #alphaCutoff: number = 0;
  #alphaMap?: MapData;
  #alphaMode: MATERIAL_ALPHA = MATERIAL_ALPHA.OPAQUE;
  #aoMap?: MapData;
  #aoMapIntensity: number = 1.0;
  #bumpMap?: MapData;
  #bumpScale: number = 1.0;
  #color: string = '#00fff7';
  #emissiveMap?: MapData;
  #emissiveness?: string;
  #glossiness: number = 1;
  #glossinessMap?: MapData;
  #map?: MapData;
  #metalness = 1.0;
  #metalnessMap?: MapData;
  #metalnessRoughnessMap?: MapData;
  #name?: string;
  #normalMap?: MapData;
  #normalScale: number = 1.0;
  #opacity = 1.0;
  #roughness = 1.0;
  #roughnessMap?: MapData;
  #shading: MATERIAL_SHADING = MATERIAL_SHADING.SMOOTH;
  #side: MATERIAL_SIDE = MATERIAL_SIDE.DOUBLE;
  #specular: string = '#ffffff';
  #specularGlossinessMap?: MapData;
  #specularMap?: MapData;

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
    },
    id?: string
  ) {
    super(id);
    if (!properties) return;
    if (properties.alphaMap !== undefined) this.alphaMap = properties.alphaMap;
    if (properties.alphaCutoff !== undefined) this.alphaCutoff = properties.alphaCutoff;
    if (properties.alphaMode !== undefined) this.alphaMode = properties.alphaMode;
    if (properties.aoMap !== undefined) this.aoMap = properties.aoMap;
    if (properties.aoMapIntensity !== undefined) this.aoMapIntensity = properties.aoMapIntensity;
    if (properties.bumpMap !== undefined) this.bumpMap = properties.bumpMap;
    if (properties.bumpScale !== undefined) this.bumpScale = properties.bumpScale;
    if (properties.color !== undefined) this.color = properties.color;
    if (properties.emissiveMap !== undefined) this.emissiveMap = properties.emissiveMap;
    if (properties.emissiveness !== undefined) this.emissiveness = properties.emissiveness;
    if (properties.shading !== undefined) this.shading = properties.shading;
    if (properties.map !== undefined) this.map = properties.map;
    if (properties.metalness !== undefined) this.metalness = properties.metalness;
    if (properties.metalnessMap !== undefined) this.metalnessMap = properties.metalnessMap;
    if (properties.metalnessRoughnessMap !== undefined) this.metalnessRoughnessMap = properties.metalnessRoughnessMap;
    if (properties.name !== undefined) this.name = properties.name;
    if (properties.normalMap !== undefined) this.normalMap = properties.normalMap;
    if (properties.normalScale !== undefined) this.normalScale = properties.normalScale;
    if (properties.opacity !== undefined) this.opacity = properties.opacity;
    if (properties.roughness !== undefined) this.roughness = properties.roughness;
    if (properties.roughnessMap !== undefined) this.roughnessMap = properties.roughnessMap;
    if (properties.side !== undefined) this.side = properties.side;
    if (properties.KHR_materials_pbrSpecularGlossiness !== undefined) this.KHR_materials_pbrSpecularGlossiness = properties.KHR_materials_pbrSpecularGlossiness;
    if (properties.KHR_materials_unlit !== undefined) this.KHR_materials_unlit = properties.KHR_materials_unlit;
    if (properties.glossiness !== undefined) this.glossiness = properties.glossiness;
    if (properties.specular !== undefined) this.specular = properties.specular;
    if (properties.specularGlossinessMap !== undefined) this.specularGlossinessMap = properties.specularGlossinessMap;
    if (properties.specularMap !== undefined) this.specularMap = properties.specularMap;
    if (properties.glossinessMap !== undefined) this.glossinessMap = properties.glossinessMap;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (58)

  public get KHR_materials_pbrSpecularGlossiness(): boolean {
    return this.#KHR_materials_pbrSpecularGlossiness;
  }

  public set KHR_materials_pbrSpecularGlossiness(value: boolean) {
    this.#KHR_materials_pbrSpecularGlossiness = value;
  }

  public get KHR_materials_unlit(): boolean {
    return this.#KHR_materials_unlit;
  }

  public set KHR_materials_unlit(value: boolean) {
    this.#KHR_materials_unlit = value;
  }

  public get alphaCutoff(): number {
    return this.#alphaCutoff;
  }

  public set alphaCutoff(value: number) {
    this.#alphaCutoff = value;
  }

  public get alphaMap(): MapData | undefined {
    return this.#alphaMap;
  }

  public set alphaMap(value: MapData | undefined) {
    this.#alphaMap = value;
  }

  public get alphaMode(): MATERIAL_ALPHA {
    return this.#alphaMode;
  }

  public set alphaMode(value: MATERIAL_ALPHA) {
    this.#alphaMode = value;
  }

  public get aoMap(): MapData | undefined {
    return this.#aoMap;
  }

  public set aoMap(value: MapData | undefined) {
    this.#aoMap = value;
  }

  public get aoMapIntensity(): number {
    return this.#aoMapIntensity;
  }

  public set aoMapIntensity(value: number) {
    this.#aoMapIntensity = value;
  }

  public get bumpMap(): MapData | undefined {
    return this.#bumpMap;
  }

  public set bumpMap(value: MapData | undefined) {
    this.#bumpMap = value;
  }

  public get bumpScale(): number {
    return this.#bumpScale;
  }

  public set bumpScale(value: number) {
    this.#bumpScale = value;
  }

  public get color(): string {
    return this.#color;
  }

  public set color(value: string) {
    this.#color = value;
  }

  public get emissiveMap(): MapData | undefined {
    return this.#emissiveMap;
  }

  public set emissiveMap(value: MapData | undefined) {
    this.#emissiveMap = value;
  }

  public get emissiveness(): string | undefined {
    return this.#emissiveness;
  }

  public set emissiveness(value: string | undefined) {
    this.#emissiveness = value;
  }

  public get glossiness(): number {
    return this.#glossiness;
  }

  public set glossiness(value: number) {
    this.#glossiness = value;
  }

  public get glossinessMap(): MapData | undefined {
    return this.#glossinessMap;
  }

  public set glossinessMap(value: MapData | undefined) {
    this.#glossinessMap = value;
  }

  public get map(): MapData | undefined {
    return this.#map;
  }

  public set map(value: MapData | undefined) {
    this.#map = value;
  }

  public get metalness(): number {
    return this.#metalness;
  }

  public set metalness(value: number) {
    this.#metalness = value;
  }

  public get metalnessMap(): MapData | undefined {
    return this.#metalnessMap;
  }

  public set metalnessMap(value: MapData | undefined) {
    this.#metalnessMap = value;
  }

  public get metalnessRoughnessMap(): MapData | undefined {
    return this.#metalnessRoughnessMap;
  }

  public set metalnessRoughnessMap(value: MapData | undefined) {
    this.#metalnessRoughnessMap = value;
  }

  public get name(): string | undefined {
    return this.#name;
  }

  public set name(value: string | undefined) {
    this.#name = value;
  }

  public get normalMap(): MapData | undefined {
    return this.#normalMap;
  }

  public set normalMap(value: MapData | undefined) {
    this.#normalMap = value;
  }

  public get normalScale(): number {
    return this.#normalScale;
  }

  public set normalScale(value: number) {
    this.#normalScale = value;
  }

  public get opacity(): number {
    return this.#opacity;
  }

  public set opacity(value: number) {
    this.#opacity = value;
  }

  public get roughness(): number {
    return this.#roughness;
  }

  public set roughness(value: number) {
    this.#roughness = value;
  }

  public get roughnessMap(): MapData | undefined {
    return this.#roughnessMap;
  }

  public set roughnessMap(value: MapData | undefined) {
    this.#roughnessMap = value;
  }

  public get shading(): MATERIAL_SHADING {
    return this.#shading;
  }

  public set shading(value: MATERIAL_SHADING) {
    this.#shading = value;
  }

  public get side(): MATERIAL_SIDE {
    return this.#side;
  }

  public set side(value: MATERIAL_SIDE) {
    this.#side = value;
  }

  public get specular(): string {
    return this.#specular;
  }

  public set specular(value: string) {
    this.#specular = value;
  }

  public get specularGlossinessMap(): MapData | undefined {
    return this.#specularGlossinessMap;
  }

  public set specularGlossinessMap(value: MapData | undefined) {
    this.#specularGlossinessMap = value;
  }

  public get specularMap(): MapData | undefined {
    return this.#specularMap;
  }

  public set specularMap(value: MapData | undefined) {
    this.#specularMap = value;
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
    }, this.id);
  }

  // #endregion Public Methods (1)
}