import { vec3 } from 'gl-matrix'

import { ILight } from './ILight'
import { ILightScene } from './ILightScene'

export interface ILightEngine {
    // #region Public Methods (12)

    addAmbientLight(properties: {color?: string | number | vec3, intensity?: number, id?: string, name?: string}): ILight;
    addDirectionalLight(properties: {color?: string | number | vec3, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, id?: string, name?: string}): ILight;
    addHemisphereLight(properties: {color?: string | number | vec3, intensity?: number, groundColor?: string | number | vec3, id?: string, name?: string}): ILight;
    addPointLight(properties: {color?: string | number | vec3, intensity?: number, position?: vec3, distance?: number, decay?: number, id?: string, name?: string}): ILight;
    addSpotLight(properties: {color?: string | number | vec3, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, id?: string, name?: string}): ILight;
    assignLightScene(id: string): boolean;
    createLightScene(properties: {name?: string, id?: string, standard?: boolean}): ILightScene;
    getLight(id: string): ILight;
    getLights(): { [key: string]: ILight };
    getLightScene(id?: string): ILightScene;
    getLightScenes(): {[key: string]: ILightScene};
    removeLight(id: string): boolean;
    removeLightScene(id: string): boolean;

    // #endregion Public Methods (12)
}