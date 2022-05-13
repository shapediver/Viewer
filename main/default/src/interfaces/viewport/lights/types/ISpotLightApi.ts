import { vec3 } from 'gl-matrix'

import { ILightApi } from '../ILightApi'

/**
 * The api for a spot light.
 * A spot light can be created by calling the {@link addSpotLight} method.
 */
export interface ISpotLightApi extends ILightApi {
    // #region Properties (6)

    /**
     * The angle of the light.
     */
    angle: number;

    /**
     * The decay of the light.
     */
    decay: number;

    /**
     * The distance of the light.
     */
    distance: number;

    /**
     * The penumbra of the light.
     */
    penumbra: number;

    /**
     * The position of the light.
     */
    position: vec3;
    
    /**
     * The target of the light.
     */
    target: vec3;

    // #endregion Properties (6)
}