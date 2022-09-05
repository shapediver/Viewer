import { IMaterialShadowData, IMaterialShadowDataProperties } from "../../interfaces/data/material/IMaterialShadowData";
import { AbstractMaterialData } from "./AbstractMaterialData";


export class MaterialShadowData extends AbstractMaterialData implements IMaterialShadowData {
    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: IMaterialShadowDataProperties,
        id?: string
    ) {
        super(properties, id);
        if (!properties) return;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public reset(): void {
        this.color = '#000000';
        this.opacity = 1.0; 
    }

    public clone(): IMaterialShadowData {
        return new MaterialShadowData({
            color: this.color,
            opacity: this.opacity,
        }, this.id);
    }

    public copy(source: MaterialShadowData): void {
        this.color = source.color;
        this.opacity = source.opacity;
    }

    // #endregion Public Methods (1)
}