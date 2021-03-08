import { vec3 } from "gl-matrix";
import { AbstractLight as Light } from "..";
import { AmbientLight } from "../implementation/types/AmbientLight";
import { DirectionalLight } from "../implementation/types/DirectionalLight";
import { HemisphereLight } from "../implementation/types/HemisphereLight";
import { PointLight } from "../implementation/types/PointLight";
import { SpotLight } from "../implementation/types/SpotLight";
import { ILightScene } from "./ILightScene";

export interface ILightEngine {
    // #region Public Methods (12)

    addAmbientLight(color: vec3, intensity: number, name?: string): AmbientLight;
    addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, name?: string): DirectionalLight;
    addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, name?: string): HemisphereLight;
    addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, name?: string): PointLight;
    addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, name?: string): SpotLight;
    assignLightScene(id: string): boolean;
    createLightScene(id?: string, standard?: boolean): string;
    getLight(id: string): Light;
    getLights(): { [key: string]: Light };
    getLightScene(): string;
    getLightScenes(): string[];
    removeLight(id: string): boolean;
    removeLightScene(id: string): boolean;

    // #endregion Public Methods (12)
}