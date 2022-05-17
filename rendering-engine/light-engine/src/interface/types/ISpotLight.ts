import { vec3 } from 'gl-matrix'

import { ILight } from '../ILight'

export interface ISpotLight extends ILight {
    angle: number;
    decay: number;
    distance: number;
    penumbra: number;
    position: vec3;
    target: vec3;

    clone(): ISpotLight;
}