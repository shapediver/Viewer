import { AbstractMaterialData } from './AbstractMaterialData';
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from '../../interfaces/data/material/IMaterialAbstractData';
import { IMaterialLineData, IMaterialLineDataProperties } from '../../interfaces/data/material/IMaterialLineData';
import { vec2 } from 'gl-matrix';

export class MaterialLineData extends AbstractMaterialData implements IMaterialLineData {
    // #region Properties (2)

    #alphaToCoverage?: boolean;
    #dashOffset?: number;
    #dashScale?: number;
    #dashSize?: number;
    #dashed?: boolean;
    #gapSize?: number;
    #lineWidth?: number;
    #resolution?: vec2;
    #worldUnits?: boolean;

    // #endregion Properties (2)

    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: IMaterialLineDataProperties,
        id?: string,
        version?: string
    ) {
        super(properties, id, version);
        if (!properties) return;
        if (properties.alphaToCoverage !== undefined) this.alphaToCoverage = properties.alphaToCoverage;
        if (properties.dashOffset !== undefined) this.dashOffset = properties.dashOffset;
        if (properties.dashScale !== undefined) this.dashScale = properties.dashScale;
        if (properties.dashSize !== undefined) this.dashSize = properties.dashSize;
        if (properties.dashed !== undefined) this.dashed = properties.dashed;
        if (properties.gapSize !== undefined) this.gapSize = properties.gapSize;
        if (properties.lineWidth !== undefined) this.lineWidth = properties.lineWidth;
        if (properties.resolution !== undefined) this.resolution = properties.resolution;
        if (properties.worldUnits !== undefined) this.worldUnits = properties.worldUnits;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)


    public get alphaToCoverage(): boolean | undefined {
        return this.#alphaToCoverage;
    }

    public set alphaToCoverage(value: boolean | undefined) {
        this.#alphaToCoverage = value;
    }

    public get dashOffset(): number | undefined {
        return this.#dashOffset;
    }

    public set dashOffset(value: number | undefined) {
        this.#dashOffset = value;
    }

    public get dashScale(): number | undefined {
        return this.#dashScale;
    }

    public set dashScale(value: number | undefined) {
        this.#dashScale = value;
    }

    public get dashSize(): number | undefined {
        return this.#dashSize;
    }

    public set dashSize(value: number | undefined) {
        this.#dashSize = value;
    }

    public get dashed(): boolean | undefined {
        return this.#dashed;
    }

    public set dashed(value: boolean | undefined) {
        this.#dashed = value;
    }

    public get gapSize(): number | undefined {
        return this.#gapSize;
    }

    public set gapSize(value: number | undefined) {
        this.#gapSize = value;
    }

    public get lineWidth(): number | undefined {
        return this.#lineWidth;
    }

    public set lineWidth(value: number | undefined) {
        this.#lineWidth = value;
    }

    public get resolution(): vec2 | undefined {
        return this.#resolution;
    }

    public set resolution(value: vec2 | undefined) {
        this.#resolution = value;
    }

    public get worldUnits(): boolean | undefined {
        return this.#worldUnits;
    }

    public set worldUnits(value: boolean | undefined) {
        this.#worldUnits = value;
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (3)

    public clone(): IMaterialLineData {
        return new MaterialLineData({
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
            alphaToCoverage: this.alphaToCoverage,
            dashOffset: this.dashOffset,
            dashScale: this.dashScale,
            dashSize: this.dashSize,
            dashed: this.dashed,
            gapSize: this.gapSize,
            lineWidth: this.lineWidth,
            resolution: this.resolution,
            worldUnits: this.worldUnits
        }, this.id, this.version);
    }

    public copy(source: MaterialLineData): void {
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

        this.alphaToCoverage = source.alphaToCoverage;
        this.dashOffset = source.dashOffset;
        this.dashScale = source.dashScale;
        this.dashSize = source.dashSize;
        this.dashed = source.dashed;
        this.gapSize = source.gapSize;
        this.lineWidth = source.lineWidth;
        this.resolution = source.resolution;
        this.worldUnits = source.worldUnits;
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

        this.alphaToCoverage = undefined;
        this.dashOffset = undefined;
        this.dashScale = undefined;
        this.dashSize = undefined;
        this.dashed = undefined;
        this.gapSize = undefined;
        this.lineWidth = undefined;
        this.resolution = undefined;
        this.worldUnits = undefined;
    }

    // #endregion Public Methods (3)
}