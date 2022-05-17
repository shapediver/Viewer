import { vec3 } from 'gl-matrix'

import { ILight } from '../ILight'

export interface IPointLight extends ILight {
    decay: number;
    distance: number;
    position: vec3;

    clone(): IPointLight;
}