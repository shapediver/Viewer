import { ITreeNodeData } from "@shapediver/viewer.node-tree.tree-node-data";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class HemisphereLight extends AbstractLight {
    // #region Constructors (1)

    constructor(
        color: vec3 = vec3.fromValues(1, 1, 1),
        intensity: number = 0.5,
        private _groundColor: vec3 = vec3.fromValues(1, 1, 1),
        name?: string
    ) {
        super(color, intensity, LIGHTTYPE.HEMISPHERE, name);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter groundColor
     * @return {vec3}
     */
    public get groundColor(): vec3 {
        return this._groundColor;
    }

    /**
     * Setter groundColor
     * @param {vec3} value
     */
    public set groundColor(value: vec3) {
        this._groundColor = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new HemisphereLight(this.color, this.intensity, this.groundColor, this.name);
    }

    // #endregion Public Methods (1)
}