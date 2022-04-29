import { MapData } from './MapData';
import { AbstractMaterialData, AbstractMaterialDataProperties, MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from './AbstractMaterialData';

export interface MaterialSpecularGlossinessDataProperties extends AbstractMaterialDataProperties {
    // #region Properties (5)

    glossiness?: number,
    glossinessMap?: MapData,
    specular?: string,
    specularGlossinessMap?: MapData,
    specularMap?: MapData,

    // #endregion Properties (5)
}

export class MaterialSpecularGlossinessData extends AbstractMaterialData {
    // #region Properties (5)

    #glossiness: number = 1;
    #glossinessMap?: MapData;
    #specular: string = '#ffffff';
    #specularGlossinessMap?: MapData;
    #specularMap?: MapData;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: MaterialSpecularGlossinessDataProperties,
        id?: string
    ) {
        super(properties, id);
        if (!properties) return;
        if (properties.glossiness !== undefined) this.glossiness = properties.glossiness;
        if (properties.specular !== undefined) this.specular = properties.specular;
        if (properties.specularGlossinessMap !== undefined) this.specularGlossinessMap = properties.specularGlossinessMap;
        if (properties.specularMap !== undefined) this.specularMap = properties.specularMap;
        if (properties.glossinessMap !== undefined) this.glossinessMap = properties.glossinessMap;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (10)

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

    // #endregion Public Accessors (10)

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
        this.emissiveness = undefined;
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
    }

    public clone(): MaterialSpecularGlossinessData {
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
    }

    // #endregion Public Methods (1)
}