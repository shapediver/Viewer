import { vec3 } from 'gl-matrix'

import { ILight } from '../ILight'

export interface IDirectionalLight extends ILight {
    castShadow: boolean;
    direction: vec3;
    shadowMapBias: number;
    shadowMapResolution: number;
    
    clone(): IDirectionalLight;
}