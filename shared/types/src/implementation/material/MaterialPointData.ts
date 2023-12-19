import { AbstractMaterialData } from './AbstractMaterialData';
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';
import { IMaterialPointData, IMaterialPointDataProperties } from '../../interfaces/data/material/IMaterialPointData';

export class MaterialPointData extends AbstractMaterialData implements IMaterialPointData {
    // #region Properties (2)

    #size?: number = undefined;
    #sizeAttenuation?: boolean = undefined;

    // #endregion Properties (2)

    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: IMaterialPointDataProperties,
        id?: string,
        version?: string
    ) {
        super(properties, id, version);
        if (!properties) return;
        if (properties.size !== undefined) this.size = properties.size;
        if (properties.sizeAttenuation !== undefined) this.sizeAttenuation = properties.sizeAttenuation;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    public get size(): number | undefined {
        return this.#size;
    }

    public set size(value: number | undefined) {
        this.#size = value;
    }

    public get sizeAttenuation(): boolean | undefined {
        return this.#sizeAttenuation;
    }

    public set sizeAttenuation(value: boolean | undefined) {
        this.#sizeAttenuation = value;
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (3)

    public clone(): IMaterialPointData {
        return new MaterialPointData({
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
            size: this.size,
            sizeAttenuation: this.sizeAttenuation
        }, this.id, this.version);
    }

    public copy(source: MaterialPointData): void {
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

        this.size = source.size;
        this.sizeAttenuation = source.sizeAttenuation;
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

        this.size = undefined;
        this.sizeAttenuation = undefined;
    }

    // #endregion Public Methods (3)
}