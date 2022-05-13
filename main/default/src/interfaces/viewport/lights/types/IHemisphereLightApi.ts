import { vec3 } from 'gl-matrix'

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
    groundColor: string | number | vec3;

    // #endregion Properties (1)
}