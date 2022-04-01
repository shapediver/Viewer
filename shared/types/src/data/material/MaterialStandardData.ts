import { MapData } from './MapData';
import { AbstractMaterialData, AbstractMaterialDataProperties } from './AbstractMaterialData';

export interface MaterialStandardDataProperties extends AbstractMaterialDataProperties {
  // #region Properties (26)

  attenuationColor?: string,
  attenuationDistance?: number;
  clearcoat?: number;
  clearcoatMap?: MapData;
  clearcoatNormalMap?: MapData;
  clearcoatRoughness?: number;
  clearcoatRoughnessMap?: MapData;
  ior?: number;
  metalness?: number,
  metalnessMap?: MapData,
  metalnessRoughnessMap?: MapData,
  roughness?: number,
  roughnessMap?: MapData,
  sheen?: number,
  sheenColor?: string,
  sheenColorMap?: MapData,
  sheenRoughness?: number,
  sheenRoughnessMap?: MapData,
  specularColor?: string,
  specularColorMap?: MapData,
  specularIntensity?: number,
  specularIntensityMap?: MapData,
  thickness?: number;
  thicknessMap?: MapData;
  transmission?: number;
  transmissionMap?: MapData;

  // #endregion Properties (26)
}

export class MaterialStandardData extends AbstractMaterialData {
  // #region Properties (26)

  #attenuationColor: string = '#ffffff';
  #attenuationDistance = 0.0;
  #clearcoat: number = 0;
  #clearcoatMap?: MapData;
  #clearcoatNormalMap?: MapData;
  #clearcoatRoughness: number = 0;
  #clearcoatRoughnessMap?: MapData;
  #ior: number = 1.5;
  #metalness = 1.0;
  #metalnessMap?: MapData;
  #metalnessRoughnessMap?: MapData;
  #roughness = 1.0;
  #roughnessMap?: MapData;
  #sheen = 0.0;
  #sheenColor: string = '#ffffff';
  #sheenColorMap?: MapData;
  #sheenRoughness = 1.0;
  #sheenRoughnessMap?: MapData;
  #specularColor: string = '#ffffff';
  #specularColorMap?: MapData;
  #specularIntensity = 1.0;
  #specularIntensityMap?: MapData;
  #thickness = 0.0;
  #thicknessMap?: MapData;
  #transmission = 0.0;
  #transmissionMap?: MapData;

  // #endregion Properties (26)

  // #region Constructors (1)

  /**
   * Creates a material data object.
   * 
   * @param _attributes the attributes of the material
   * @param id the id
   */
  constructor(
    properties?: MaterialStandardDataProperties,
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

  public get clearcoatMap(): MapData | undefined {
    return this.#clearcoatMap;
  }

  public set clearcoatMap(value: MapData | undefined) {
    this.#clearcoatMap = value;
  }

  public get clearcoatNormalMap(): MapData | undefined {
    return this.#clearcoatNormalMap;
  }

  public set clearcoatNormalMap(value: MapData | undefined) {
    this.#clearcoatNormalMap = value;
  }

  public get clearcoatRoughness(): number {
    return this.#clearcoatRoughness;
  }

  public set clearcoatRoughness(value: number) {
    this.#clearcoatRoughness = value;
  }

  public get clearcoatRoughnessMap(): MapData | undefined {
    return this.#clearcoatRoughnessMap;
  }

  public set clearcoatRoughnessMap(value: MapData | undefined) {
    this.#clearcoatRoughnessMap = value;
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

  public get sheenColorMap(): MapData | undefined {
    return this.#sheenColorMap;
  }

  public set sheenColorMap(value: MapData | undefined) {
    this.#sheenColorMap = value;
  }

  public get sheenRoughness(): number {
    return this.#sheenRoughness;
  }

  public set sheenRoughness(value: number) {
    this.#sheenRoughness = value;
  }

  public get sheenRoughnessMap(): MapData | undefined {
    return this.#sheenRoughnessMap;
  }

  public set sheenRoughnessMap(value: MapData | undefined) {
    this.#sheenRoughnessMap = value;
  }

  public get specularColor(): string {
    return this.#specularColor;
  }

  public set specularColor(value: string) {
    this.#specularColor = value;
  }

  public get specularColorMap(): MapData | undefined {
    return this.#specularColorMap;
  }

  public set specularColorMap(value: MapData | undefined) {
    this.#specularColorMap = value;
  }

  public get specularIntensity(): number {
    return this.#specularIntensity;
  }

  public set specularIntensity(value: number) {
    this.#specularIntensity = value;
  }

  public get specularIntensityMap(): MapData | undefined {
    return this.#specularIntensityMap;
  }

  public set specularIntensityMap(value: MapData | undefined) {
    this.#specularIntensityMap = value;
  }

  public get thickness(): number {
    return this.#thickness;
  }

  public set thickness(value: number) {
    this.#thickness = value;
  }

  public get thicknessMap(): MapData | undefined {
    return this.#thicknessMap;
  }

  public set thicknessMap(value: MapData | undefined) {
    this.#thicknessMap = value;
  }

  public get transmission(): number {
    return this.#transmission;
  }

  public set transmission(value: number) {
    this.#transmission = value;
  }

  public get transmissionMap(): MapData | undefined {
    return this.#transmissionMap;
  }

  public set transmissionMap(value: MapData | undefined) {
    this.#transmissionMap = value;
  }

  // #endregion Public Accessors (52)

  // #region Public Methods (1)

  /**
   * Clones the scene graph data.
   */
  public clone(): MaterialStandardData {
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

  // #endregion Public Methods (1)
}