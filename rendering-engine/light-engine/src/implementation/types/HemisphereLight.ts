import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class HemisphereLight extends AbstractLight {
    // #region Constructors (1)

    constructor(
        color: string = '#ffffff',
        intensity: number = 0.5,
        private _groundColor: string = '#ffffff',
        name?: string
    ) {
        super(color, intensity, LIGHTTYPE.HEMISPHERE, name);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter groundColor
     * @return {string}
     */
    public get groundColor(): string {
        return this._groundColor;
    }

    /**
     * Setter groundColor
     * @param {string} value
     */
    public set groundColor(value: string) {
        this._groundColor = value;
        this.updateVersion();
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new HemisphereLight(this.color, this.intensity, this.groundColor, this.name);
    }

    // #endregion Public Methods (1)
}