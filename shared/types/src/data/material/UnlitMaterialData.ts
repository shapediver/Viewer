import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { AbstractMaterialData, AbstractMaterialDataProperties } from "./AbstractMaterialData";

export interface UnlitMaterialDataProperties extends AbstractMaterialDataProperties {};

export class UnlitMaterialData extends AbstractMaterialData {
    // #region Constructors (1)

    /**
     * Creates a material data object.
     * 
     * @param _attributes the attributes of the material
     * @param id the id
     */
    constructor(
        properties?: UnlitMaterialDataProperties,
        id?: string
    ) {
        super(properties, id);
        if (!properties) return;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): UnlitMaterialData {
        return new UnlitMaterialData({
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
        }, this.id);
    }

    // #endregion Public Methods (1)
}