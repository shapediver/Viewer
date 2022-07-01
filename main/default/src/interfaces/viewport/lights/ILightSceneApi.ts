import { ITreeNode } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix'

import { ILightApi } from './ILightApi'
import { IAmbientLightApi } from './types/IAmbientLightApi'
import { IDirectionalLightApi } from './types/IDirectionalLightApi'
import { IHemisphereLightApi } from './types/IHemisphereLightApi'
import { IPointLightApi } from './types/IPointLightApi'
import { ISpotLightApi } from './types/ISpotLightApi'

/**
 * The api for a light scene.
 * A light scene is a collection of lights. Therefore multiple light scene can be used to switch between different lighting environments.
 * It can be created by calling the {@link createLightScene} method.
 */
export interface ILightSceneApi {
    // #region Properties (4)

    /**
     * The id of the light scene.
     */
    readonly id: string;
    
    /**
     * The node in which the lights are stored in the [scene tree]{@link ITree}.
     */
    readonly node: ITreeNode;

    /**
     * The collection of lights in the light scene.
     */
    lights: { [key: string]: ILightApi; };

    /**
     * The name of the light scene.
     */
    name?: string

    // #endregion Properties (4)

    // #region Public Methods (6)

    /**
     * Create an ambient light and add it to the light scene.
     * 
     * @param properties.color The color of the light.
     * @param properties.intensity The intensity of the light. (0-Infinity, default: 0.5)
     * @param properties.id The id of the light.
     * @param properties.name The name of the light.
     */
    addAmbientLight(properties: {
        color?: string | number | vec3, 
        intensity?: number, 
        id?: string, 
        name?: string
    }): IAmbientLightApi;
    
    /**
     * Create a directional light and add it to the light scene.
     * 
     * @param properties.color The color of the light.
     * @param properties.intensity The intensity of the light. (0-Infinity, default: 0.5)
     * @param properties.id The id of the light.
     * @param properties.name The name of the light.
     * @param properties.direction The direction of the light.
     * @param properties.castShadow Option for the light to cast shadows.
     * @param properties.shadowMapResolution The resolution of the shadow map. (default: 1024, has to be power of two)
     * @param properties.shadowMapBias The bias of the shadow map. For more info on the shadow bias, see [here](https://digitalrune.github.io/DigitalRune-Documentation/html/3f4d959e-9c98-4a97-8d85-7a73c26145d7.htm).
     */
    addDirectionalLight(properties: {
        color?: string | number | vec3, 
        intensity?: number, 
        direction?: vec3, 
        castShadow?: boolean, 
        shadowMapResolution?: number, 
        shadowMapBias?: number, 
        id?: string, 
        name?: string
    }): IDirectionalLightApi;

    /**
     * Create an hemisphere light and add it to the light scene.
     * 
     * @param properties.color The color of the light.
     * @param properties.intensity The intensity of the light. (0-Infinity, default: 0.5)
     * @param properties.id The id of the light.
     * @param properties.name The name of the light.
     * @param properties.groundColor The ground color of the light.
     */
    addHemisphereLight(properties: {
        color?: string | number | vec3, 
        intensity?: number, 
        groundColor?: string | number | vec3, 
        id?: string, 
        name?: string
    }): IHemisphereLightApi;

    /**
     * Create a point light and add it to the light scene.
     * 
     * @param properties.color The color of the light.
     * @param properties.intensity The intensity of the light. (0-Infinity, default: 0.5)
     * @param properties.id The id of the light.
     * @param properties.name The name of the light.
     * @param properties.position The position of the light.
     * @param properties.distance The distance of the light.
     * @param properties.decay The decay of the light.
     */
    addPointLight(properties: {
        color?: string | number | vec3, 
        intensity?: number, 
        position?: vec3, 
        distance?: number, 
        decay?: number, 
        id?: string, 
        name?: string
    }): IPointLightApi;

    /**
     * Create a point light and add it to the light scene.
     * 
     * @param properties.color The color of the light.
     * @param properties.intensity The intensity of the light. (0-Infinity, default: 0.5)
     * @param properties.id The id of the light.
     * @param properties.name The name of the light.
     * @param properties.position The position of the light.
     * @param properties.target The target of the light.
     * @param properties.distance The distance of the light.
     * @param properties.decay The decay of the light.
     * @param properties.angle The angle of the light.
     * @param properties.penumbra The penumbra of the light.
     */
    addSpotLight(properties: {
        color?: string | number | vec3, 
        intensity?: number, 
        position?: vec3, 
        target?: vec3, 
        distance?: number, 
        decay?: number, 
        angle?: number, 
        penumbra?: number, 
        id?: string, 
        name?: string
    }): ISpotLightApi;

    /**
     * Remove a light from the light scene with the specified id.
     * 
     * @param id The id of the light to remove.
     */
    removeLight(id: string): boolean;

    // #endregion Public Methods (6)
}