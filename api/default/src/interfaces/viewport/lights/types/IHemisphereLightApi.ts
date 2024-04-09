import { vec3 } from 'gl-matrix'
import { Color } from '@shapediver/viewer.shared.types'

import { ILightApi } from '../ILightApi'

/**
 * The api for an hemisphere light.
 * An hemisphere light can be created by calling the {@link addHemisphereLight} method.
 */
export interface IHemisphereLightApi extends ILightApi {
    // #region Properties (1)

    /**
     * The ground color of the light.
     */
    groundColor: Color;

    // #endregion Properties (1)
}