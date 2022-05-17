import { vec3 } from 'gl-matrix'

import { ILight } from '../ILight'

export interface IHemisphereLight extends ILight {
    groundColor: string | number | vec3;

    clone(): IHemisphereLight;
}