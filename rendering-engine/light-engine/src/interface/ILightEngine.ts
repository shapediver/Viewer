import { vec3 } from "gl-matrix";
import { AmbientLight } from "../implementation/types/AmbientLight";
import { DirectionalLight } from "../implementation/types/DirectionalLight";
import { HemisphereLight } from "../implementation/types/HemisphereLight";
import { PointLight } from "../implementation/types/PointLight";
import { SpotLight } from "../implementation/types/SpotLight";
import { ILightScene } from "./ILightScene";

export interface ILightEngine {
    // #region Public Methods (11)

    addAmbientLight(color: vec3, intensity: number, name?: string): AmbientLight;
    addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, name?: string): DirectionalLight;
    addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, name?: string): HemisphereLight;
    addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, name?: string): PointLight;
    addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, name?: string): SpotLight;
    createLightScene(id?: string, standard?: boolean): string;
    deleteLightScene(id: string): boolean;
    getCurrentLightScene(): string;
    getLightScene(id: string): ILightScene;
    removeLight(id: string): boolean;
    setCurrentLightScene(id: string): boolean;

    // #endregion Public Methods (11)
}