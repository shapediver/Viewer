import { vec3 } from 'gl-matrix'
import { LIGHT_TYPE } from '@shapediver/viewer.rendering-engine.light-engine';

/**
 * The api for a light, please see the definitions for [ambient]{@link IAmbientLightApi}, [directional]{@link IDirectionalLightApi}, [hemisphere]{@link IHemisphereLightApi}, [point]{@link IPointLightApi} and [spot]{@link ISpotLightApi} as this is just a shared interface for all of them.
 * A light can be created by calling the corresponding method in the [light scene]{@link ILightSceneApi}.
 * A light has a multitude of properties and methods that can be used to adjust the behavior.
 */
export interface ILightApi {
  // #region Properties (6)

  /**
   * The id of the light.
   */
  readonly id: string;

  /**
   * The type of the light.
   */
  readonly type: LIGHT_TYPE;

  /**
   * The color of the light.
   */
  color: string | number | vec3;

  /**
   * The intensity of the light.
   */
  intensity: number;

  /**
   * The name of the light.
   * Used by the platform.
   */
  name?: string;

  /**
   * The order of the light.
   * Used by the platform.
   */
  order?: number;

  // #endregion Properties (6)
}