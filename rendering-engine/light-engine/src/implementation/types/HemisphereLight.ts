import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class HemisphereLight extends AbstractLight {
    // #region Properties (1)

    private _groundColor: string = '#ffffff';

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(properties: {
        color?: string,
        groundColor?: string,
        intensity?: number,
        name?: string,
    }) {
        super({
            color: properties.color || '#ffffff',
            intensity: properties.intensity || 0.5,
            type: LIGHTTYPE.HEMISPHERE,
            name: properties.name,
        });

        if (properties.groundColor) this._groundColor = properties.groundColor;
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
        return new HemisphereLight({
            color: this.color,
            groundColor: this.groundColor,
            intensity: this.intensity,
            name: this.name,
        });
    }

    // #endregion Public Methods (1)
}