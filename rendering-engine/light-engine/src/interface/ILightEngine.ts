import { vec3 } from "gl-matrix";
import { AmbientLight } from "../implementation/types/AmbientLight";
import { DirectionalLight } from "../implementation/types/DirectionalLight";
import { HemisphereLight } from "../implementation/types/HemisphereLight";
import { PointLight } from "../implementation/types/PointLight";
import { SpotLight } from "../implementation/types/SpotLight";
import { ILight } from "./ILight";
import { ILightScene } from "./ILightScene";

export interface ILightEngine {
    // #region Public Methods (12)

    addAmbientLight(color: vec3, intensity: number, name?: string): ILight;
    addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, shadowMapResolution: number, shadowMapRadius: number, shadowMapBias: number, name?: string): ILight;
    addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, name?: string): ILight;
    addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, name?: string): ILight;
    addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, name?: string): ILight;
    assignLightScene(id: string): boolean;
    createLightScene(id?: string, standard?: boolean): string;
    getLight(id: string): ILight;
    getLights(): { [key: string]: ILight };
    getLightScene(): string;
    getLightScenes(): string[];
    removeLight(id: string): boolean;
    removeLightScene(id: string): boolean;

    // #endregion Public Methods (12)
}