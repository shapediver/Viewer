import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHT_TYPE } from '../../interface/ILight'
import { IDirectionalLight } from '../../interface/types/IDirectionalLight';
import { AbstractLight } from '../AbstractLight'

export class DirectionalLight extends AbstractLight implements IDirectionalLight {
    // #region Properties (4)

    private _castShadow: boolean = false;
    private _direction: vec3 = vec3.fromValues(-1, 0, 1);
    private _shadowMapBias: number = -0.003;
    private _shadowMapResolution: number = 1024;
    private _threeJsObject: { [key: string]: THREE.DirectionalLight } = {};

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(properties: {
        color?: string,
        intensity?: number,
        direction?: vec3,
        castShadow?: boolean,
        shadowMapResolution?: number,
        shadowMapBias?: number,
        name?: string,
        order?: number,
        id?: string
    }) {
        super({
            color: properties.color || '#ffffff', 
            intensity: properties.intensity !== undefined ? properties.intensity : 0.5, 
            type: LIGHT_TYPE.DIRECTIONAL,
            name: properties.name,
            order: properties.order,
            id: properties.id
        });

        if(properties.direction) this._direction = properties.direction;
        if(properties.castShadow) this._castShadow = properties.castShadow;
        if(properties.shadowMapResolution) this._shadowMapResolution = properties.shadowMapResolution;
        if(properties.shadowMapBias) this._shadowMapBias = properties.shadowMapBias;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get castShadow(): boolean {
        return this._castShadow;
    }

    public set castShadow(value: boolean) {
        this._castShadow = value;
        this.updateVersion();
    }

    public get direction(): vec3 {
        return this._direction;
    }

    public set direction(value: vec3) {
        this._direction = value;
        this.updateVersion();
    }

    public get shadowMapBias(): number {
        return this._shadowMapBias;
    }

    public set shadowMapBias(value: number) {
        this._shadowMapBias = value;
        this.updateVersion();
    }

    public get shadowMapResolution(): number {
        return this._shadowMapResolution;
    }

    public set shadowMapResolution(value: number) {
        this._shadowMapResolution = value;
        this.updateVersion();
    }

    public get threeJsObject(): { [key: string]: THREE.DirectionalLight } {
        return this._threeJsObject;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (1)

    public clone(): IDirectionalLight {
        return new DirectionalLight({
            color: this.color,
            intensity: this.intensity,
            direction: this.direction,
            castShadow: this.castShadow,
            shadowMapResolution: this.shadowMapResolution,
            shadowMapBias: this.shadowMapBias,
            name: this.name,
            order: this.order
        });
    }

    // #endregion Public Methods (1)
}