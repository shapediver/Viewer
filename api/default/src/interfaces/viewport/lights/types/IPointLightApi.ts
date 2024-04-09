import { vec3 } from 'gl-matrix'

import { ILightApi } from '../ILightApi'

/**
 * The api for a point light.
 * A point light can be created by calling the {@link addPointLight} method.
 */
export interface IPointLightApi extends ILightApi {
    // #region Properties (3)

    /**
     * The decay of the light.
     */
    decay: number;

    /**
     * The distance of the light.
     */
    distance: number;

    /**
     * The position of the light.
     */
    position: vec3;

    // #endregion Properties (3)
}