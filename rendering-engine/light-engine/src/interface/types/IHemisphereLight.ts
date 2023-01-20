import { Color } from '@shapediver/viewer.shared.types'

import { ILight } from '../ILight'

export interface IHemisphereLight extends ILight {
    groundColor: Color;

    clone(): IHemisphereLight;
}