import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class AmbientLight extends AbstractLight {
    // #region Constructors (1)

    constructor(
        color: vec3 = vec3.fromValues(1, 1, 1),
        intensity: number = 0.5,
        name?: string
    ) {
        super(color, intensity, LIGHTTYPE.AMBIENT, name);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new AmbientLight(this.color, this.intensity, this.name);
    }

    // #endregion Public Methods (1)
}