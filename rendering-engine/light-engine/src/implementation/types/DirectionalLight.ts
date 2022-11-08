import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { LIGHT_TYPE } from '../../interface/ILight'
import { IDirectionalLight } from '../../interface/types/IDirectionalLight';
import { AbstractLight } from '../AbstractLight'

export class DirectionalLight extends AbstractLight implements IDirectionalLight {
    // #region Properties (4)

    #castShadow: boolean = true;
    #direction: vec3 = vec3.fromValues(-1, 0, 1);
    #shadowMapBias: number = -0.003;
    #shadowMapResolution: number = 1024;
    #threeJsObject: { [key: string]: THREE.DirectionalLight } = {};

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
            intensity: properties.intensity !== undefined ? properties.intensity : 1, 
            type: LIGHT_TYPE.DIRECTIONAL,
            name: properties.name,
            order: properties.order,
            id: properties.id
        });

        if(properties.direction) this.#direction = properties.direction;
        if(properties.castShadow !== undefined) this.#castShadow = properties.castShadow;
        if(properties.shadowMapResolution) this.#shadowMapResolution = properties.shadowMapResolution;
        if(properties.shadowMapBias) this.#shadowMapBias = properties.shadowMapBias;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get castShadow(): boolean {
        return this.#castShadow;
    }

    public set castShadow(value: boolean) {
        this.#castShadow = value;
        this.updateVersion();
    }

    public get direction(): vec3 {
        return this.#direction;
    }

    public set direction(value: vec3) {
        this.#direction = value;
        this.updateVersion();
    }

    public get shadowMapBias(): number {
        return this.#shadowMapBias;
    }

    public set shadowMapBias(value: number) {
        this.#shadowMapBias = value;
        this.updateVersion();
    }

    public get shadowMapResolution(): number {
        return this.#shadowMapResolution;
    }

    public set shadowMapResolution(value: number) {
        this.#shadowMapResolution = value;
        this.updateVersion();
    }

    public get threeJsObject(): { [key: string]: THREE.DirectionalLight } {
        return this.#threeJsObject;
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