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
        private _shadowMapResolution: number = 1024,
        private _shadowMapRadius: number = 10,
        private _shadowMapBias: number = -0.00175,
        name?: string
    ) {
        super(color, intensity, LIGHTTYPE.DIRECTIONAL, name);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (10)

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
        this.updateVersion();
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
        this.updateVersion();
    }

    /**
     * Getter shadowMapBias
     * @return {number}
     */
    public get shadowMapBias(): number {
        return this._shadowMapBias;
    }

    /**
     * Setter shadowMapBias
     * @param {number} value
     */
    public set shadowMapBias(value: number) {
        this._shadowMapBias = value;
        this.updateVersion();
    }

    /**
     * Getter shadowMapRadius
     * @return {number}
     */
    public get shadowMapRadius(): number {
        return this._shadowMapRadius;
    }

    /**
     * Setter shadowMapRadius
     * @param {number} value
     */
    public set shadowMapRadius(value: number) {
        this._shadowMapRadius = value;
        this.updateVersion();
    }

    /**
     * Getter shadowMapResolution
     * @return {number}
     */
    public get shadowMapResolution(): number {
        return this._shadowMapResolution;
    }

    /**
     * Setter shadowMapResolution
     * @param {number} value
     */
    public set shadowMapResolution(value: number) {
        this._shadowMapResolution = value;
        this.updateVersion();
    }

    // #endregion Public Accessors (10)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new DirectionalLight(this.color, this.intensity, this.direction, this.castShadow, this.shadowMapResolution, this.shadowMapRadius, this.shadowMapBias, this.name);
    }

    // #endregion Public Methods (1)
}