import { AbstractMaterialData } from './AbstractMaterialData';
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';
import { IMaterialMultiPointData, IMaterialMultiPointDataProperties } from '../../interfaces/data/material/IMaterialMultiPointData';
import { IMapData } from '../../interfaces/data/material/IMapData';
import { Color } from '../../types';

export class MaterialMultiPointData extends AbstractMaterialData implements IMaterialMultiPointData {
    // #region Properties (20)

    #alphaMap_0?: IMapData = undefined;
    #alphaMap_1?: IMapData = undefined;
    #alphaMap_2?: IMapData = undefined;
    #alphaMap_3?: IMapData = undefined;
    #color_0?: Color = '#ffffff';
    #color_1?: Color = '#ffffff';
    #color_2?: Color = '#ffffff';
    #color_3?: Color = '#ffffff';
    #map_0?: IMapData = undefined;
    #map_1?: IMapData = undefined;
    #map_2?: IMapData = undefined;
    #map_3?: IMapData = undefined;
    #materialIndexDataMap?: IMapData = undefined;
    #materialIndexDataMapSize?: number = undefined;
    #size_3?: number = undefined;
    #sizeAttenuation_3?: boolean = undefined;
    #sizeAttenuation_0?: boolean = undefined;
    #sizeAttenuation_1?: boolean = undefined;
    #sizeAttenuation_2?: boolean = undefined;
    #size_0?: number = undefined;
    #size_1?: number = undefined;
    #size_2?: number = undefined;

    // #endregion Properties (20)

    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: IMaterialMultiPointDataProperties,
        id?: string,
        version?: string
    ) {
        super(properties, id, version);
        if (!properties) return;

        if (properties.materialIndexDataMap !== undefined) this.materialIndexDataMap = properties.materialIndexDataMap;
        if (properties.materialIndexDataMapSize !== undefined) this.materialIndexDataMapSize = properties.materialIndexDataMapSize;

        if (properties.alphaMap_0 !== undefined) this.alphaMap_0 = properties.alphaMap_0;
        if (properties.color_0 !== undefined) this.color_0 = properties.color_0;
        if (properties.map_0 !== undefined) this.map_0 = properties.map_0;
        if (properties.size_0 !== undefined) this.size_0 = properties.size_0;
        if (properties.sizeAttenuation_0 !== undefined) this.sizeAttenuation_0 = properties.sizeAttenuation_0;

        if (properties.alphaMap_1 !== undefined) this.alphaMap_1 = properties.alphaMap_1;
        if (properties.color_1 !== undefined) this.color_1 = properties.color_1;
        if (properties.map_1 !== undefined) this.map_1 = properties.map_1;
        if (properties.size_1 !== undefined) this.size_1 = properties.size_1;
        if (properties.sizeAttenuation_1 !== undefined) this.sizeAttenuation_1 = properties.sizeAttenuation_1;

        if (properties.alphaMap_2 !== undefined) this.alphaMap_2 = properties.alphaMap_2;
        if (properties.color_2 !== undefined) this.color_2 = properties.color_2;
        if (properties.map_2 !== undefined) this.map_2 = properties.map_2;
        if (properties.size_2 !== undefined) this.size_2 = properties.size_2;
        if (properties.sizeAttenuation_2 !== undefined) this.sizeAttenuation_2 = properties.sizeAttenuation_2;

        if (properties.alphaMap_3 !== undefined) this.alphaMap_3 = properties.alphaMap_3;
        if (properties.color_3 !== undefined) this.color_3 = properties.color_3;
        if (properties.map_3 !== undefined) this.map_3 = properties.map_3;
        if (properties.size_3 !== undefined) this.size_3 = properties.size_3;
        if (properties.sizeAttenuation_3 !== undefined) this.sizeAttenuation_3 = properties.sizeAttenuation_3;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (40)

    public get alphaMap_0(): IMapData | undefined {
        return this.#alphaMap_0;
    }

    public set alphaMap_0(value: IMapData | undefined) {
        this.#alphaMap_0 = value;
    }

    public get alphaMap_1(): IMapData | undefined {
        return this.#alphaMap_1;
    }

    public set alphaMap_1(value: IMapData | undefined) {
        this.#alphaMap_1 = value;
    }

    public get alphaMap_2(): IMapData | undefined {
        return this.#alphaMap_2;
    }

    public set alphaMap_2(value: IMapData | undefined) {
        this.#alphaMap_2 = value;
    }

    public get color_0(): Color | undefined {
        return this.#color_0;
    }

    public set color_0(value: Color | undefined) {
        this.#color_0 = value;
    }

    public get color_1(): Color | undefined {
        return this.#color_1;
    }

    public set color_1(value: Color | undefined) {
        this.#color_1 = value;
    }

    public get color_2(): Color | undefined {
        return this.#color_2;
    }

    public set color_2(value: Color | undefined) {
        this.#color_2 = value;
    }
    
    public get map_0(): IMapData | undefined {
        return this.#map_0;
    }

    public set map_0(value: IMapData | undefined) {
        this.#map_0 = value;
    }

    public get map_1(): IMapData | undefined {
        return this.#map_1;
    }

    public set map_1(value: IMapData | undefined) {
        this.#map_1 = value;
    }

    public get map_2(): IMapData | undefined {
        return this.#map_2;
    }

    public set map_2(value: IMapData | undefined) {
        this.#map_2 = value;
    }

    public get materialIndexDataMap(): IMapData | undefined {
        return this.#materialIndexDataMap;
    }

    public set materialIndexDataMap(value: IMapData | undefined) {
        this.#materialIndexDataMap = value;
    }

    public get materialIndexDataMapSize(): number | undefined {
        return this.#materialIndexDataMapSize;
    }

    public set materialIndexDataMapSize(value: number | undefined) {
        this.#materialIndexDataMapSize = value;
    }

    public get sizeAttenuation_0(): boolean | undefined {
        return this.#sizeAttenuation_0;
    }

    public set sizeAttenuation_0(value: boolean | undefined) {
        this.#sizeAttenuation_0 = value;
    }

    public get sizeAttenuation_1(): boolean | undefined {
        return this.#sizeAttenuation_1;
    }

    public set sizeAttenuation_1(value: boolean | undefined) {
        this.#sizeAttenuation_1 = value;
    }

    public get sizeAttenuation_2(): boolean | undefined {
        return this.#sizeAttenuation_2;
    }

    public set sizeAttenuation_2(value: boolean | undefined) {
        this.#sizeAttenuation_2 = value;
    }

    public get size_0(): number | undefined {
        return this.#size_0;
    }

    public set size_0(value: number | undefined) {
        this.#size_0 = value;
    }

    public get size_1(): number | undefined {
        return this.#size_1;
    }

    public set size_1(value: number | undefined) {
        this.#size_1 = value;
    }

    public get size_2(): number | undefined {
        return this.#size_2;
    }

    public set size_2(value: number | undefined) {
        this.#size_2 = value;
    }

    public get alphaMap_3(): IMapData | undefined {
        return this.#alphaMap_3;
    }
    
    public set alphaMap_3(value: IMapData | undefined) {
        this.#alphaMap_3 = value;
    }

    public get color_3(): Color | undefined {
        return this.#color_3;
    }

    public set color_3(value: Color | undefined) {
        this.#color_3 = value;
    }

    public get map_3(): IMapData | undefined {
        return this.#map_3;
    }

    public set map_3(value: IMapData | undefined) {
        this.#map_3 = value;
    }

    public get size_3(): number | undefined {
        return this.#size_3;
    }

    public set size_3(value: number | undefined) {
        this.#size_3 = value;
    }

    public get sizeAttenuation_3(): boolean | undefined {
        return this.#sizeAttenuation_3;
    }

    public set sizeAttenuation_3(value: boolean | undefined) {
        this.#sizeAttenuation_3 = value;
    }

    // #endregion Public Getters And Setters (40)

    // #region Public Methods (3)

    public clone(): IMaterialMultiPointData {
        return new MaterialMultiPointData({
            alphaMode: this.alphaMode,
            alphaCutoff: this.alphaCutoff,
            aoMap: this.aoMap,
            aoMapIntensity: this.aoMapIntensity,
            bumpMap: this.bumpMap,
            bumpScale: this.bumpScale,
            emissiveMap: this.emissiveMap,
            emissiveness: this.emissiveness,
            shading: this.shading,
            name: this.name,
            normalMap: this.normalMap,
            normalScale: this.normalScale,
            opacity: this.opacity,
            side: this.side,
            
            alphaMap_0: this.alphaMap_0,
            alphaMap_1: this.alphaMap_1,
            alphaMap_2: this.alphaMap_2,
            alphaMap_3: this.alphaMap_3,
            color_0: this.color_0,
            color_1: this.color_1,
            color_2: this.color_2,
            color_3: this.color_3,
            map_0: this.map_0,
            map_1: this.map_1,
            map_2: this.map_2,
            map_3: this.map_3,
            materialIndexDataMap: this.materialIndexDataMap,
            materialIndexDataMapSize: this.materialIndexDataMapSize,
            size_0: this.size_0,
            size_1: this.size_1,
            size_2: this.size_2,
            size_3: this.size_3,
            sizeAttenuation_0: this.sizeAttenuation_0,
            sizeAttenuation_1: this.sizeAttenuation_1,
            sizeAttenuation_2: this.sizeAttenuation_2,
            sizeAttenuation_3: this.sizeAttenuation_3
        }, this.id, this.version);
    }

    public copy(source: MaterialMultiPointData): void {
        this.alphaCutoff = source.alphaCutoff;
        this.alphaMode = source.alphaMode;
        this.aoMap = source.aoMap;
        this.aoMapIntensity = source.aoMapIntensity;
        this.bumpMap = source.bumpMap;
        this.bumpScale = source.bumpScale;
        this.emissiveMap = source.emissiveMap;
        this.emissiveness = source.emissiveness;
        this.materialOutput = source.materialOutput;
        this.normalMap = source.normalMap;
        this.normalScale = source.normalScale;
        this.opacity = source.opacity;
        this.shading = source.shading;
        this.side = source.side;

        this.alphaMap_0 = source.alphaMap_0;
        this.alphaMap_1 = source.alphaMap_1;
        this.alphaMap_2 = source.alphaMap_2;
        this.alphaMap_3 = source.alphaMap_3;
        this.color_0 = source.color_0;
        this.color_1 = source.color_1;
        this.color_2 = source.color_2;
        this.color_3 = source.color_3;
        this.map_0 = source.map_0;
        this.map_1 = source.map_1;
        this.map_2 = source.map_2;
        this.map_3 = source.map_3;
        this.materialIndexDataMap = source.materialIndexDataMap;
        this.materialIndexDataMapSize = source.materialIndexDataMapSize;
        this.size_0 = source.size_0;
        this.size_1 = source.size_1;
        this.size_2 = source.size_2;
        this.size_3 = source.size_3;
        this.sizeAttenuation_0 = source.sizeAttenuation_0;
        this.sizeAttenuation_1 = source.sizeAttenuation_1;
        this.sizeAttenuation_2 = source.sizeAttenuation_2;
        this.sizeAttenuation_3 = source.sizeAttenuation_3;
    }

    public reset(): void {
        this.alphaCutoff = 0;
        this.alphaMode = MATERIAL_ALPHA.OPAQUE;
        this.aoMap = undefined;
        this.aoMapIntensity = 1.0;
        this.bumpMap = undefined;
        this.bumpScale = 1.0;
        this.emissiveMap = undefined;
        this.emissiveness = '#000000';
        this.materialOutput = false;
        this.normalMap = undefined;
        this.normalScale = 1.0;
        this.opacity = 1.0;
        this.shading = MATERIAL_SHADING.SMOOTH;
        this.side = MATERIAL_SIDE.DOUBLE;

        this.alphaMap_0 = undefined;
        this.alphaMap_1 = undefined;
        this.alphaMap_2 = undefined;
        this.alphaMap_3 = undefined;
        this.color_0 = '#ffffff';
        this.color_1 = '#ffffff';
        this.color_2 = '#ffffff';
        this.color_3 = '#ffffff';
        this.map_0 = undefined;
        this.map_1 = undefined;
        this.map_2 = undefined;
        this.map_3 = undefined;
        this.materialIndexDataMap = undefined;
        this.materialIndexDataMapSize = undefined;
        this.size_0 = undefined;
        this.size_1 = undefined;
        this.size_2 = undefined;
        this.size_3 = undefined;
        this.sizeAttenuation_0 = undefined;
        this.sizeAttenuation_1 = undefined;
        this.sizeAttenuation_2 = undefined;
        this.sizeAttenuation_3 = undefined;
    }

    // #endregion Public Methods (3)
}