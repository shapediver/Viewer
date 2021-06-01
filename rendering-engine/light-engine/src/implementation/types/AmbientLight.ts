import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class AmbientLight extends AbstractLight {
    // #region Constructors (1)

    constructor(properties: {
        color?: string,
        intensity?: number,
        name?: string,
        id?: string
    }) {
        super({
            color: properties.color || '#ffffff', 
            intensity: properties.intensity || 0.5, 
            type: LIGHTTYPE.AMBIENT,
            name: properties.name,
            id: properties.id 
        });
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new AmbientLight({
            color: this.color || '#ffffff', 
            intensity: this.intensity || 0.5, 
            name: this.name
        });
    }

    // #endregion Public Methods (1)
}