import { AbstractMaterialData } from './AbstractMaterialData';
import { IMaterialGemData, IMaterialGemDataProperties } from '../../interfaces/data/material/IMaterialGemDataProperties';
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';
import { IMapData } from '../../interfaces/data/material/IMapData';
import { mat3, mat4, vec3 } from 'gl-matrix';

export class MaterialGemData extends AbstractMaterialData implements IMaterialGemData {
    // #region Properties (5)


    #refractionIndex: number = 2.4;
    #impurityMap?: IMapData;
    #impurityScale: number = 1.0;
    #colorTransferBegin: string = '#ffffff';
    #colorTransferEnd: string = '#ffffff';
    #center: vec3 = vec3.create();
    #radius: number = 1;
    #sphericalNormalMap?: IMapData;
    #gamma: number = 1;
    #contrast: number = 1;
    #brightness: number = 0;
    #dispersion: number = 0;
    #tracingDepth: number = 5;
    #tracingOpacity: number = 0;
    #inverseModelMatrix: mat4 = mat4.create();
    #inverseTransposeModelMatrix: mat3 = mat3.create();
    #envMap?: string | string[];

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: IMaterialGemDataProperties,
        id?: string
    ) {
        super(properties, id);
        if (!properties) return;

        if (properties.refractionIndex !== undefined) this.refractionIndex = properties.refractionIndex;
        if (properties.impurityMap !== undefined) this.impurityMap = properties.impurityMap;
        if (properties.impurityScale !== undefined) this.impurityScale = properties.impurityScale;
        if (properties.colorTransferBegin !== undefined) this.colorTransferBegin = properties.colorTransferBegin;
        if (properties.colorTransferEnd !== undefined) this.colorTransferEnd = properties.colorTransferEnd;
        if (properties.center !== undefined) this.center = properties.center;
        if (properties.tracingDepth !== undefined) this.tracingDepth = properties.tracingDepth;
        if (properties.radius !== undefined) this.radius = properties.radius;
        if (properties.sphericalNormalMap !== undefined) this.sphericalNormalMap = properties.sphericalNormalMap;
        if (properties.gamma !== undefined) this.gamma = properties.gamma;
        if (properties.contrast !== undefined) this.contrast = properties.contrast;
        if (properties.brightness !== undefined) this.brightness = properties.brightness;
        if (properties.dispersion !== undefined) this.dispersion = properties.dispersion;
        if (properties.tracingOpacity !== undefined) this.tracingOpacity = properties.tracingOpacity;
        if (properties.inverseModelMatrix !== undefined) this.inverseModelMatrix = properties.inverseModelMatrix;
        if (properties.inverseTransposeModelMatrix !== undefined) this.inverseTransposeModelMatrix = properties.inverseTransposeModelMatrix;
        if (properties.envMap !== undefined) this.envMap = properties.envMap;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (10)

    public get refractionIndex(): number {
        return this.#refractionIndex;
    }

    public set refractionIndex(value: number) {
        this.#refractionIndex = value;
    }

    public get impurityMap(): IMapData | undefined {
        return this.#impurityMap;
    }

    public set impurityMap(value: IMapData | undefined) {
        this.#impurityMap = value;
    }

    public get impurityScale(): number {
        return this.#impurityScale;
    }

    public set impurityScale(value: number) {
        this.#impurityScale = value;
    }

    public get colorTransferBegin(): string {
        return this.#colorTransferBegin;
    }

    public set colorTransferBegin(value: string) {
        this.#colorTransferBegin = value;
    }

    public get colorTransferEnd(): string {
        return this.#colorTransferEnd;
    }

    public set colorTransferEnd(value: string) {
        this.#colorTransferEnd = value;
    }

    public get center(): vec3 {
        return this.#center;
    }

    public set center(value: vec3) {
        this.#center = value;
    }

    public get tracingDepth(): number {
        return this.#tracingDepth;
    }

    public set tracingDepth(value: number) {
        this.#tracingDepth = value;
    }

    public get radius(): number {
        return this.#radius;
    }

    public set radius(value: number) {
        this.#radius = value;
    }

    public get sphericalNormalMap(): IMapData | undefined {
        return this.#sphericalNormalMap;
    }

    public set sphericalNormalMap(value: IMapData | undefined) {
        this.#sphericalNormalMap = value;
    }

    public get gamma(): number {
        return this.#gamma;
    }

    public set gamma(value: number) {
        this.#gamma = value;
    }

    public get contrast(): number {
        return this.#contrast;
    }

    public set contrast(value: number) {
        this.#contrast = value;
    }

    public get brightness(): number {
        return this.#brightness;
    }

    public set brightness(value: number) {
        this.#brightness = value;
    }

    public get dispersion(): number {
        return this.#dispersion;
    }

    public set dispersion(value: number) {
        this.#dispersion = value;
    }

    public get tracingOpacity(): number {
        return this.#tracingOpacity;
    }

    public set tracingOpacity(value: number) {
        this.#tracingOpacity = value;
    }

    public get inverseModelMatrix(): mat4 {
        return this.#inverseModelMatrix;
    }

    public set inverseModelMatrix(value: mat4) {
        this.#inverseModelMatrix = value;
    }

    public get inverseTransposeModelMatrix(): mat3 {
        return this.#inverseTransposeModelMatrix;
    }

    public set inverseTransposeModelMatrix(value: mat3) {
        this.#inverseTransposeModelMatrix = value;
    }
  
    public get envMap(): string | string[] | undefined {
      return this.#envMap;
    }
  
    public set envMap(value: string | string[] | undefined) {
      this.#envMap = value;
    }

    // #endregion Public Accessors (10)

    // #region Public Methods (3)

    public clone(): IMaterialGemData {
        return new MaterialGemData({
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
            name: this.name,
            normalMap: this.normalMap,
            normalScale: this.normalScale,
            opacity: this.opacity,
            side: this.side,
            refractionIndex: this.refractionIndex,
            impurityMap: this.impurityMap,
            impurityScale: this.impurityScale,
            colorTransferBegin: this.colorTransferBegin,
            colorTransferEnd: this.colorTransferEnd,
            center: this.center,
            tracingDepth: this.tracingDepth,
            radius: this.radius,
            sphericalNormalMap: this.sphericalNormalMap,
            gamma: this.gamma,
            contrast: this.contrast,
            brightness: this.brightness,
            dispersion: this.dispersion,
            tracingOpacity: this.tracingOpacity,
            inverseModelMatrix: this.inverseModelMatrix,
            inverseTransposeModelMatrix: this.inverseTransposeModelMatrix,
            envMap: this.envMap,
        }, this.id);
    }

    public copy(source: MaterialGemData): void {
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
        
        this.refractionIndex = this.refractionIndex;
        this.impurityMap = this.impurityMap;
        this.impurityScale = this.impurityScale;
        this.colorTransferBegin = this.colorTransferBegin;
        this.colorTransferEnd = this.colorTransferEnd;
        this.center = this.center;
        this.tracingDepth = this.tracingDepth;
        this.radius = this.radius;
        this.sphericalNormalMap = this.sphericalNormalMap;
        this.gamma = this.gamma;
        this.contrast = this.contrast;
        this.brightness = this.brightness;
        this.dispersion = this.dispersion;
        this.tracingOpacity = this.tracingOpacity;
        this.inverseModelMatrix = this.inverseModelMatrix;
        this.inverseTransposeModelMatrix = this.inverseTransposeModelMatrix;
        this.envMap = source.envMap;
    }

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

        this.refractionIndex = 2.4;
        this.impurityMap = undefined;
        this.impurityScale = 1.0;
        this.colorTransferBegin = '#ffffff';
        this.colorTransferEnd = '#ffffff';
        this.center = vec3.create();
        this.radius = 1;
        this.sphericalNormalMap = undefined;
        this.gamma = 1;
        this.contrast = 1;
        this.brightness = 0;
        this.dispersion = 0;
        this.tracingDepth = 5;
        this.tracingOpacity = 0;
        this.inverseModelMatrix = mat4.create();
        this.inverseTransposeModelMatrix = mat3.create();
        this.envMap = undefined;
    }

    // #endregion Public Methods (3)
}