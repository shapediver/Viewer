import { AbstractMaterialData } from './AbstractMaterialData';
import { IMaterialSpecularGlossinessData, IMaterialSpecularGlossinessDataProperties } from '../../interfaces/data/material/IMaterialSpecularGlossinessDataProperties';
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';
import { IMapData } from '../../interfaces/data/material/IMapData';

export class MaterialSpecularGlossinessData extends AbstractMaterialData implements IMaterialSpecularGlossinessData {
    // #region Properties (5)

    #glossiness: number = 1;
    #glossinessMap?: IMapData;
    #specular: string = '#ffffff';
    #specularGlossinessMap?: IMapData;
    #specularMap?: IMapData;
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
        properties?: IMaterialSpecularGlossinessDataProperties,
        id?: string
    ) {
        super(properties, id);
        if (!properties) return;
        if (properties.glossiness !== undefined) this.glossiness = properties.glossiness;
        if (properties.specular !== undefined) this.specular = properties.specular;
        if (properties.specularGlossinessMap !== undefined) this.specularGlossinessMap = properties.specularGlossinessMap;
        if (properties.specularMap !== undefined) this.specularMap = properties.specularMap;
        if (properties.glossinessMap !== undefined) this.glossinessMap = properties.glossinessMap;
        if (properties.envMap !== undefined) this.envMap = properties.envMap;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (10)


    public get envMap(): string | string[] | undefined {
        return this.#envMap;
    }

    public set envMap(value: string | string[] | undefined) {
        this.#envMap = value;
    }

    public get glossiness(): number {
        return this.#glossiness;
    }

    public set glossiness(value: number) {
        this.#glossiness = value;
    }

    public get glossinessMap(): IMapData | undefined {
        return this.#glossinessMap;
    }

    public set glossinessMap(value: IMapData | undefined) {
        this.#glossinessMap = value;
    }

    public get specular(): string {
        return this.#specular;
    }

    public set specular(value: string) {
        this.#specular = value;
    }

    public get specularGlossinessMap(): IMapData | undefined {
        return this.#specularGlossinessMap;
    }

    public set specularGlossinessMap(value: IMapData | undefined) {
        this.#specularGlossinessMap = value;
    }

    public get specularMap(): IMapData | undefined {
        return this.#specularMap;
    }

    public set specularMap(value: IMapData | undefined) {
        this.#specularMap = value;
    }

    // #endregion Public Accessors (10)

    // #region Public Methods (3)

    public clone(): IMaterialSpecularGlossinessData {
        return new MaterialSpecularGlossinessData({
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
            specular: this.specular,
            specularMap: this.specularMap,
            specularGlossinessMap: this.specularGlossinessMap,
            glossiness: this.glossiness,
            glossinessMap: this.glossinessMap,
            envMap: this.envMap,
        }, this.id);
    }

    public copy(source: MaterialSpecularGlossinessData): void {
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

        this.glossiness = source.glossiness;
        this.specular = source.specular;
        this.specularGlossinessMap = source.specularGlossinessMap;
        this.specularMap = source.specularMap;
        this.glossinessMap = source.glossinessMap;
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

        this.glossiness = 1;
        this.specular = '#ffffff';
        this.specularGlossinessMap = undefined;
        this.specularMap = undefined;
        this.glossinessMap = undefined;
        this.envMap = undefined;
    }

    // #endregion Public Methods (3)
}