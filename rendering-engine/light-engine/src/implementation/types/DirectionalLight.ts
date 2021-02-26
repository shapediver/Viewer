import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class DirectionalLight extends AbstractLight {
    // #region Constructors (1)

    constructor(
        color: vec3 = vec3.fromValues(1, 1, 1),
        intensity: number = 0.5,
        private _direction: vec3 = vec3.fromValues(-1, 0, 1),
        private _castShadow: boolean = false,
        name?: string
    ) {
        super(color, intensity, LIGHTTYPE.DIRECTIONAL, name);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (4)

    /**
     * Getter castShadow
     * @return {boolean}
     */
    public get castShadow(): boolean {
        return this._castShadow;
    }

    /**
     * Setter castShadow
     * @param {boolean} value
     */
    public set castShadow(value: boolean) {
        this._castShadow = value;
    }

    /**
     * Getter direction
     * @return {vec3}
     */
    public get direction(): vec3 {
        return this._direction;
    }

    /**
     * Setter direction
     * @param {vec3} value
     */
    public set direction(value: vec3) {
        this._direction = value;
    }

    // #endregion Public Accessors (4)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new DirectionalLight(this.color, this.intensity, this.direction, this.castShadow, this.name);
    }

    // #endregion Public Methods (1)
}