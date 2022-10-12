import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IMapData } from '../../interfaces/data/material/IMapData';
import { IMaterialAbstractData, IMaterialAbstractDataProperties, MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';


export abstract class AbstractMaterialData extends AbstractTreeNodeData implements IMaterialAbstractData {
  // #region Properties (17)

  #alphaCutoff: number = 0;
  #alphaMap?: IMapData;
  #alphaMode: MATERIAL_ALPHA = MATERIAL_ALPHA.OPAQUE;
  #aoMap?: IMapData;
  #aoMapIntensity: number = 1.0;
  #bumpMap?: IMapData;
  #bumpScale: number = 1.0;
  #color: string = '#ffffff';
  #emissiveMap?: IMapData;
  #emissiveness: string = '#000000';
  #materialOutput: boolean = false;
  #map?: IMapData;
  #name?: string;
  #normalMap?: IMapData;
  #normalScale: number = 1.0;
  #opacity = 1.0;
  #shading: MATERIAL_SHADING = MATERIAL_SHADING.SMOOTH;
  #side: MATERIAL_SIDE = MATERIAL_SIDE.DOUBLE;
  #threeJsObject: { [key: string]: THREE.Material } = {};

  // #endregion Properties (17)

  // #region Constructors (1)

  /**
   * Creates a material data object.
   * 
   * @param _attributes the attributes of the material
   * @param id the id
   */
  constructor(
    properties?: IMaterialAbstractDataProperties,
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
    if (properties.name !== undefined) this.name = properties.name;
    if (properties.normalMap !== undefined) this.normalMap = properties.normalMap;
    if (properties.normalScale !== undefined) this.normalScale = properties.normalScale;
    if (properties.opacity !== undefined) this.opacity = properties.opacity;
    if (properties.side !== undefined) this.side = properties.side;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (34)

  public get alphaCutoff(): number {
    return this.#alphaCutoff;
  }

  public set alphaCutoff(value: number) {
    this.#alphaCutoff = value;
  }

  public get alphaMap(): IMapData | undefined {
    return this.#alphaMap;
  }

  public set alphaMap(value: IMapData | undefined) {
    this.#alphaMap = value;
  }

  public get alphaMode(): MATERIAL_ALPHA {
    return this.#alphaMode;
  }

  public set alphaMode(value: MATERIAL_ALPHA) {
    this.#alphaMode = value;
  }

  public get aoMap(): IMapData | undefined {
    return this.#aoMap;
  }

  public set aoMap(value: IMapData | undefined) {
    this.#aoMap = value;
  }

  public get aoMapIntensity(): number {
    return this.#aoMapIntensity;
  }

  public set aoMapIntensity(value: number) {
    this.#aoMapIntensity = value;
  }

  public get bumpMap(): IMapData | undefined {
    return this.#bumpMap;
  }

  public set bumpMap(value: IMapData | undefined) {
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

  public get emissiveMap(): IMapData | undefined {
    return this.#emissiveMap;
  }

  public set emissiveMap(value: IMapData | undefined) {
    this.#emissiveMap = value;
  }

  public get emissiveness(): string {
    return this.#emissiveness;
  }

  public set emissiveness(value: string) {
    this.#emissiveness = value;
  }

  public get map(): IMapData | undefined {
    return this.#map;
  }

  public set map(value: IMapData | undefined) {
    this.#map = value;
  }

  public get materialOutput(): boolean {
    return this.#materialOutput;
  }

  public set materialOutput(value: boolean) {
    this.#materialOutput = value;
  }

  public get name(): string | undefined {
    return this.#name;
  }

  public set name(value: string | undefined) {
    this.#name = value;
  }

  public get normalMap(): IMapData | undefined {
    return this.#normalMap;
  }

  public set normalMap(value: IMapData | undefined) {
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
  
  public get threeJsObject(): { [key: string]: THREE.Material } {
    return this.#threeJsObject;
  }

  // #endregion Public Accessors (34)

  // #region Public Abstract Methods (1)

  /**
   * Reset the material data.
   */
  public abstract reset(): void;

  /**
   * Clones the scene graph data.
   */
  public abstract clone(): IMaterialAbstractData;

  /**
   * Copy all properties of another material data object.
   * 
   * @param source 
   */
  public abstract copy(source: IMaterialAbstractData): void;

  // #endregion Public Abstract Methods (1)
}