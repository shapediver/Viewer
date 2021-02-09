import { ITreeNodeData } from "@shapediver/viewer.node-tree.tree-node-data";
import { vec3 } from "gl-matrix";
import { LIGHT_TYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class AmbientLight extends AbstractLight {
    // #region Constructors (1)

    constructor(
        color: vec3 = vec3.fromValues(1, 1, 1),
        intensity: number = 0.5,
        name?: string
    ) {
        super(color, intensity, LIGHT_TYPE.AMBIENT, name);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new AmbientLight(this.color, this.intensity, this.name);
    }

    // #endregion Public Methods (1)
}