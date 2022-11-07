import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_SIDE } from "../../interfaces/data/material/IMaterialAbstractData";
import { IMaterialUnlitData, IMaterialUnlitDataProperties } from "../../interfaces/data/material/IMaterialUnlitData";
import { AbstractMaterialData } from "./AbstractMaterialData";

export class MaterialUnlitData extends AbstractMaterialData implements IMaterialUnlitData {
    // #region Properties (1)

    #envMap?: string | string[];

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: IMaterialUnlitDataProperties,
        id?: string
    ) {
        super(properties, id);
        if (!properties) return;
        if (properties.envMap !== undefined) this.envMap = properties.envMap;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get envMap(): string | string[] | undefined {
        return this.#envMap;
    }

    public set envMap(value: string | string[] | undefined) {
        this.#envMap = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (3)

    public clone(): IMaterialUnlitData {
        return new MaterialUnlitData({
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
            envMap: this.envMap
        }, this.id);
    }

    public copy(source: MaterialUnlitData): void {
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
        this.envMap = undefined;
    }

    // #endregion Public Methods (3)
}