import { vec3 } from 'gl-matrix'

import { ILightApi } from '../ILightApi'

/**
 * The api for a directional light.
 * A directional light can be created by calling the {@link addDirectionalLight} method.
 */
export interface IDirectionalLightApi extends ILightApi {
    // #region Properties (4)

    /**
     * Option to cast shadows.
     */
    castShadow: boolean;

    /**
     * The direction of the light.
     */
    direction: vec3;

    /**
     * The bias of the shadow map.
     */
    shadowMapBias: number;
    
    /** 
     * The resolution of the shadow map.
     */
    shadowMapResolution: number;

    // #endregion Properties (4)
}