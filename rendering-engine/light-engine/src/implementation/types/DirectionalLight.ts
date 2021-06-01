import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { vec3 } from "gl-matrix";
import { LIGHTTYPE } from "../../interface/ILight";
import { AbstractLight } from "../AbstractLight";

export class DirectionalLight extends AbstractLight {
    // #region Properties (4)

    private _castShadow: boolean = false;
    private _direction: vec3 = vec3.fromValues(-1, 0, 1);
    private _shadowMapBias: number = -0.00175;
    private _shadowMapResolution: number = 1024;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(properties: {
        color?: string,
        intensity?: number,
        direction?: vec3,
        castShadow?: boolean,
        shadowMapResolution?: number,
        shadowMapBias?: number,
        name?: string
    }) {
        super({
            color: properties.color || '#ffffff', 
            intensity: properties.intensity || 0.5, 
            type: LIGHTTYPE.DIRECTIONAL,
            name: properties.name,
        });

        if(properties.direction) this._direction = properties.direction;
        if(properties.castShadow) this._castShadow = properties.castShadow;
        if(properties.shadowMapResolution) this._shadowMapResolution = properties.shadowMapResolution;
        if(properties.shadowMapBias) this._shadowMapBias = properties.shadowMapBias;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

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

    // #endregion Public Accessors (8)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new DirectionalLight({
            color: this.color,
            intensity: this.intensity,
            direction: this.direction,
            castShadow: this.castShadow,
            shadowMapResolution: this.shadowMapResolution,
            shadowMapBias: this.shadowMapBias,
            name: this.name,
        });
    }

    // #endregion Public Methods (1)
}