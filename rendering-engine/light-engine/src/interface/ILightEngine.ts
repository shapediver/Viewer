import { vec3 } from "gl-matrix";
import { ILight } from "./ILight";

export interface ILightEngine {
    // #region Public Methods (12)

    addAmbientLight(properties: {color?: vec3, intensity?: number, name?: string}): ILight;
    addDirectionalLight(properties: {color?: vec3, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, name?: string}): ILight;
    addHemisphereLight(properties: {color?: vec3, intensity?: number, groundColor?: vec3, name?: string}): ILight;
    addPointLight(properties: {color?: vec3, intensity?: number, position?: vec3, distance?: number, decay?: number, name?: string}): ILight;
    addSpotLight(properties: {color?: vec3, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, name?: string}): ILight;
    assignLightScene(id: string): boolean;
    createLightScene(properties: {id?: string, standard?: boolean}): string;
    getLight(id: string): ILight;
    getLights(): { [key: string]: ILight };
    getLightScene(): string;
    getLightScenes(): string[];
    removeLight(id: string): boolean;
    removeLightScene(id: string): boolean;

    // #endregion Public Methods (12)
}