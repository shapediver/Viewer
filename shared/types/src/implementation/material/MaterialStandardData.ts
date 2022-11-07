import { AbstractMaterialData } from './AbstractMaterialData';
import { IMaterialStandardData, IMaterialStandardDataProperties } from '../../interfaces/data/material/IMaterialStandardData';
import { IMapData } from '../../interfaces/data/material/IMapData';
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';

export class MaterialStandardData extends AbstractMaterialData implements IMaterialStandardData {
  // #region Properties (26)

  #attenuationColor: string = '#ffffff';
  #attenuationDistance = 0.0;
  #clearcoat: number = 0;
  #clearcoatMap?: IMapData;
  #clearcoatNormalMap?: IMapData;
  #clearcoatRoughness: number = 0;
  #clearcoatRoughnessMap?: IMapData;
  #displacementMap?: IMapData;
  #displacementScale: number = 1;
  #displacementBias: number = 0;
  #envMap?: string | string[];
  #ior: number = 1.5;
  #metalness = 1.0;
  #metalnessMap?: IMapData;
  #metalnessRoughnessMap?: IMapData;
  #roughness = 1.0;
  #roughnessMap?: IMapData;
  #sheen = 0.0;
  #sheenColor: string = '#ffffff';
  #sheenColorMap?: IMapData;
  #sheenRoughness = 1.0;
  #sheenRoughnessMap?: IMapData;
  #specularColor: string = '#ffffff';
  #specularColorMap?: IMapData;
  #specularIntensity = 1.0;
  #specularIntensityMap?: IMapData;
  #thickness = 0.0;
  #thicknessMap?: IMapData;
  #transmission = 0.0;
  #transmissionMap?: IMapData;

  // #endregion Properties (26)

  // #region Constructors (1)

  /**
   * Creates a material data object.
   * 
   * @param _attributes the attributes of the material
   * @param id the id
   */
  constructor(
    properties?: IMaterialStandardDataProperties,
    id?: string
  ) {
    super(properties, id);
    if (!properties) return;
    if (properties.metalness !== undefined) this.metalness = properties.metalness;
    if (properties.metalnessMap !== undefined) this.metalnessMap = properties.metalnessMap;
    if (properties.metalnessRoughnessMap !== undefined) this.metalnessRoughnessMap = properties.metalnessRoughnessMap;
    if (properties.roughness !== undefined) this.roughness = properties.roughness;
    if (properties.roughnessMap !== undefined) this.roughnessMap = properties.roughnessMap;
    if (properties.clearcoat !== undefined) this.clearcoat = properties.clearcoat;
    if (properties.clearcoatMap !== undefined) this.clearcoatMap = properties.clearcoatMap;
    if (properties.clearcoatNormalMap !== undefined) this.clearcoatNormalMap = properties.clearcoatNormalMap;
    if (properties.clearcoatRoughness !== undefined) this.clearcoatRoughness = properties.clearcoatRoughness;
    if (properties.clearcoatRoughnessMap !== undefined) this.clearcoatRoughnessMap = properties.clearcoatRoughnessMap;
    if (properties.displacementMap !== undefined) this.displacementMap = properties.displacementMap;
    if (properties.displacementScale !== undefined) this.displacementScale = properties.displacementScale;
    if (properties.displacementBias !== undefined) this.displacementBias = properties.displacementBias;
    if (properties.ior !== undefined) this.ior = properties.ior;
    if (properties.transmission !== undefined) this.transmission = properties.transmission;
    if (properties.transmissionMap !== undefined) this.transmissionMap = properties.transmissionMap;
    if (properties.thickness !== undefined) this.thickness = properties.thickness;
    if (properties.thicknessMap !== undefined) this.thicknessMap = properties.thicknessMap;
    if (properties.attenuationDistance !== undefined) this.attenuationDistance = properties.attenuationDistance;
    if (properties.attenuationColor !== undefined) this.attenuationColor = properties.attenuationColor;
    if (properties.sheen !== undefined) this.sheen = properties.sheen;
    if (properties.sheenColor !== undefined) this.sheenColor = properties.sheenColor;
    if (properties.sheenRoughness !== undefined) this.sheenRoughness = properties.sheenRoughness;
    if (properties.sheenColorMap !== undefined) this.sheenColorMap = properties.sheenColorMap;
    if (properties.sheenRoughnessMap !== undefined) this.sheenRoughnessMap = properties.sheenRoughnessMap;
    if (properties.specularColor !== undefined) this.specularColor = properties.specularColor;
    if (properties.specularColorMap !== undefined) this.specularColorMap = properties.specularColorMap;
    if (properties.specularIntensity !== undefined) this.specularIntensity = properties.specularIntensity;
    if (properties.specularIntensityMap !== undefined) this.specularIntensityMap = properties.specularIntensityMap;
    if (properties.envMap !== undefined) this.envMap = properties.envMap;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (52)

  public get attenuationColor(): string {
    return this.#attenuationColor;
  }

  public set attenuationColor(value: string) {
    this.#attenuationColor = value;
  }

  public get attenuationDistance(): number {
    return this.#attenuationDistance;
  }

  public set attenuationDistance(value: number) {
    this.#attenuationDistance = value;
  }

  public get clearcoat(): number {
    return this.#clearcoat;
  }

  public set clearcoat(value: number) {
    this.#clearcoat = value;
  }

  public get clearcoatMap(): IMapData | undefined {
    return this.#clearcoatMap;
  }

  public set clearcoatMap(value: IMapData | undefined) {
    this.#clearcoatMap = value;
  }

  public get clearcoatNormalMap(): IMapData | undefined {
    return this.#clearcoatNormalMap;
  }

  public set clearcoatNormalMap(value: IMapData | undefined) {
    this.#clearcoatNormalMap = value;
  }

  public get clearcoatRoughness(): number {
    return this.#clearcoatRoughness;
  }

  public set clearcoatRoughness(value: number) {
    this.#clearcoatRoughness = value;
  }

  public get clearcoatRoughnessMap(): IMapData | undefined {
    return this.#clearcoatRoughnessMap;
  }

  public set clearcoatRoughnessMap(value: IMapData | undefined) {
    this.#clearcoatRoughnessMap = value;
  }

  public get displacementMap(): IMapData | undefined {
    return this.#displacementMap;
  }

  public set displacementMap(value: IMapData | undefined) {
    this.#displacementMap = value;
  }
  
  public get displacementScale(): number {
    return this.#displacementScale;
  }

  public set displacementScale(value: number) {
    this.#displacementScale = value;
  }
  
  public get displacementBias(): number {
    return this.#displacementBias;
  }

  public set displacementBias(value: number) {
    this.#displacementBias = value;
  }
  
  public get envMap(): string | string[] | undefined {
    return this.#envMap;
  }

  public set envMap(value: string | string[] | undefined) {
    this.#envMap = value;
  }

  public get ior(): number {
    return this.#ior;
  }

  public set ior(value: number) {
    this.#ior = value;
  }

  public get metalness(): number {
    return this.#metalness;
  }

  public set metalness(value: number) {
    this.#metalness = value;
  }

  public get metalnessMap(): IMapData | undefined {
    return this.#metalnessMap;
  }

  public set metalnessMap(value: IMapData | undefined) {
    this.#metalnessMap = value;
  }

  public get metalnessRoughnessMap(): IMapData | undefined {
    return this.#metalnessRoughnessMap;
  }

  public set metalnessRoughnessMap(value: IMapData | undefined) {
    this.#metalnessRoughnessMap = value;
  }

  public get roughness(): number {
    return this.#roughness;
  }

  public set roughness(value: number) {
    this.#roughness = value;
  }

  public get roughnessMap(): IMapData | undefined {
    return this.#roughnessMap;
  }

  public set roughnessMap(value: IMapData | undefined) {
    this.#roughnessMap = value;
  }

  public get sheen(): number {
    return this.#sheen;
  }

  public set sheen(value: number) {
    this.#sheen = value;
  }

  public get sheenColor(): string {
    return this.#sheenColor;
  }

  public set sheenColor(value: string) {
    this.#sheenColor = value;
  }

  public get sheenColorMap(): IMapData | undefined {
    return this.#sheenColorMap;
  }

  public set sheenColorMap(value: IMapData | undefined) {
    this.#sheenColorMap = value;
  }

  public get sheenRoughness(): number {
    return this.#sheenRoughness;
  }

  public set sheenRoughness(value: number) {
    this.#sheenRoughness = value;
  }

  public get sheenRoughnessMap(): IMapData | undefined {
    return this.#sheenRoughnessMap;
  }

  public set sheenRoughnessMap(value: IMapData | undefined) {
    this.#sheenRoughnessMap = value;
  }

  public get specularColor(): string {
    return this.#specularColor;
  }

  public set specularColor(value: string) {
    this.#specularColor = value;
  }

  public get specularColorMap(): IMapData | undefined {
    return this.#specularColorMap;
  }

  public set specularColorMap(value: IMapData | undefined) {
    this.#specularColorMap = value;
  }

  public get specularIntensity(): number {
    return this.#specularIntensity;
  }

  public set specularIntensity(value: number) {
    this.#specularIntensity = value;
  }

  public get specularIntensityMap(): IMapData | undefined {
    return this.#specularIntensityMap;
  }

  public set specularIntensityMap(value: IMapData | undefined) {
    this.#specularIntensityMap = value;
  }

  public get thickness(): number {
    return this.#thickness;
  }

  public set thickness(value: number) {
    this.#thickness = value;
  }

  public get thicknessMap(): IMapData | undefined {
    return this.#thicknessMap;
  }

  public set thicknessMap(value: IMapData | undefined) {
    this.#thicknessMap = value;
  }

  public get transmission(): number {
    return this.#transmission;
  }

  public set transmission(value: number) {
    this.#transmission = value;
  }

  public get transmissionMap(): IMapData | undefined {
    return this.#transmissionMap;
  }

  public set transmissionMap(value: IMapData | undefined) {
    this.#transmissionMap = value;
  }

  // #endregion Public Accessors (52)

  // #region Public Methods (1)

  public reset(): void {
    this.alphaCutoff = 0;
    this.alphaMap = undefined;
    this.alphaMode = MATERIAL_ALPHA.OPAQUE;
    this.aoMap = undefined;
    this.aoMapIntensity = 1.0;
    this.bumpMap = undefined;
    this.bumpScale = 1.0;
    this.color = '#ffffff';
    this.emissiveMap = undefined;
    this.emissiveness = '#000000';
    this.materialOutput = false;
    this.map = undefined;
    this.normalMap = undefined;
    this.normalScale = 1.0;
    this.opacity = 1.0;
    this.shading = MATERIAL_SHADING.SMOOTH;
    this.side = MATERIAL_SIDE.DOUBLE;
    
    this.attenuationColor = '#ffffff';
    this.attenuationDistance = 1;
    this.clearcoat = 0;
    this.clearcoatMap = undefined;
    this.clearcoatNormalMap = undefined;
    this.clearcoatRoughness = 0;
    this.clearcoatRoughnessMap = undefined;
    this.displacementMap = undefined;
    this.displacementScale = 1;
    this.displacementBias = 0;
    this.envMap = undefined;
    this.ior = 1;
    this.metalness = 0;
    this.metalnessMap = undefined;
    this.metalnessRoughnessMap = undefined;
    this.roughness = 0.5;
    this.roughnessMap = undefined;
    this.sheen = 0;
    this.sheenColor = '#ffffff';
    this.sheenColorMap = undefined;
    this.sheenRoughness = 0;
    this.sheenRoughnessMap = undefined;
    this.specularColor = '#ffffff';
    this.specularColorMap = undefined;
    this.specularIntensity = 1;
    this.specularIntensityMap = undefined;
    this.thickness = 0.1;
    this.thicknessMap = undefined;
    this.transmission = 0;
    this.transmissionMap = undefined;
  }

  public clone(): IMaterialStandardData {
    return new MaterialStandardData({
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
      clearcoat: this.clearcoat,
      clearcoatMap: this.clearcoatMap,
      clearcoatNormalMap: this.clearcoatNormalMap,
      clearcoatRoughness: this.clearcoatRoughness,
      clearcoatRoughnessMap: this.clearcoatRoughnessMap,
      displacementMap: this.displacementMap,
      displacementScale: this.displacementScale,
      displacementBias: this.displacementBias,
      envMap: this.envMap,
      ior: this.ior,
      transmission: this.transmission,
      transmissionMap: this.transmissionMap,
      thickness: this.thickness,
      thicknessMap: this.thicknessMap,
      attenuationDistance: this.attenuationDistance,
      attenuationColor: this.attenuationColor,
      sheen: this.sheen,
      sheenColor: this.sheenColor,
      sheenColorMap: this.sheenColorMap,
      sheenRoughness: this.sheenRoughness,
      sheenRoughnessMap: this.sheenRoughnessMap,
      specularColor: this.specularColor,
      specularColorMap: this.specularColorMap,
      specularIntensity: this.specularIntensity,
      specularIntensityMap: this.specularIntensityMap,
    }, this.id);
  }

  public copy(source: MaterialStandardData): void {
    this.alphaCutoff = source.alphaCutoff;
    this.alphaMap = source.alphaMap;
    this.alphaMode = source.alphaMode;
    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;
    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;
    this.color = source.color;
    this.emissiveMap = source.emissiveMap;
    this.emissiveness = source.emissiveness;
    this.materialOutput = source.materialOutput;
    this.map = source.map;
    this.normalMap = source.normalMap;
    this.normalScale = source.normalScale;
    this.opacity = source.opacity;
    this.shading = source.shading;
    this.side = source.side;
    
    this.attenuationColor = source.attenuationColor;
    this.attenuationDistance = source.attenuationDistance;
    this.clearcoat = source.clearcoat;
    this.clearcoatMap = source.clearcoatMap;
    this.clearcoatNormalMap = source.clearcoatNormalMap;
    this.clearcoatRoughness = source.clearcoatRoughness;
    this.clearcoatRoughnessMap = source.clearcoatRoughnessMap;
    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;
    this.envMap = source.envMap;
    this.ior = source.ior;
    this.metalness = source.metalness;
    this.metalnessMap = source.metalnessMap;
    this.metalnessRoughnessMap = source.metalnessRoughnessMap;
    this.roughness = source.roughness;
    this.roughnessMap = source.roughnessMap;
    this.sheen = source.sheen;
    this.sheenColor = source.sheenColor;
    this.sheenColorMap = source.sheenColorMap;
    this.sheenRoughness = source.sheenRoughness;
    this.sheenRoughnessMap = source.sheenRoughnessMap;
    this.specularColor = source.specularColor;
    this.specularColorMap = source.specularColorMap;
    this.specularIntensity = source.specularIntensity;
    this.specularIntensityMap = source.specularIntensityMap;
    this.thickness = source.thickness;
    this.thicknessMap = source.thicknessMap;
    this.transmission = source.transmission;
    this.transmissionMap = source.transmissionMap;
  }

  // #endregion Public Methods (1)
}