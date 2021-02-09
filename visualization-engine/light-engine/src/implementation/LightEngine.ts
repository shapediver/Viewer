import { singleton } from "tsyringe"
import { vec3 } from "gl-matrix";
import { ILightEngine } from "..";
import { AmbientLight } from "./types/AmbientLight";
import { DirectionalLight } from "./types/DirectionalLight";
import { HemisphereLight } from "./types/HemisphereLight";
import { PointLight } from "./types/PointLight";
import { SpotLight } from "./types/SpotLight";
import uuid from "@shapediver/viewer.utils.uuid"
import { LightScene } from "./LightScene";
import { ILightScene } from "../interface/ILightScene";

@singleton()
export class LightEngine implements ILightEngine {
    // #region Properties (2)

    private _currentLightScene: LightScene = new LightScene('main');
    private _lightScenes: { [key: string]: LightScene; } = {
        'main': this._currentLightScene
    };

    // #endregion Properties (2)

    // #region Public Methods (11)

    public addAmbientLight(color: vec3, intensity: number, name?: string): AmbientLight {
        const light = new AmbientLight(color, intensity, name);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addDirectionalLight(color: vec3, intensity: number, direction: vec3, castShadow: boolean, name?: string): DirectionalLight {
        const light = new DirectionalLight(color, intensity, direction, castShadow, name);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addHemisphereLight(color: vec3, intensity: number, groundColor: vec3, name?: string): HemisphereLight {
        const light = new HemisphereLight(color, intensity, groundColor, name);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addPointLight(color: vec3, intensity: number, position: vec3, distance: number, decay: number, name?: string): PointLight {
        const light = new PointLight(color, intensity, position, distance, decay, name);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addSpotLight(color: vec3, intensity: number, position: vec3, target: vec3, distance: number, decay: number, angle: number, penumbra: number, name?: string): SpotLight {
        const light = new SpotLight(color, intensity, position, target, distance, decay, angle, penumbra, name);
        this._currentLightScene.addLight(light);
        return light;
    }

    public createLightScene(id?: string, standard?: boolean): string {
        if (!id || this._lightScenes[id]) id = uuid.create();
        const lightScene = new LightScene(id);
        if (standard === true) {
            lightScene.addLight(new AmbientLight(vec3.fromValues(1, 1, 1), 0.5));
            lightScene.addLight(new DirectionalLight(vec3.fromValues(1, 1, 1), 0.75, vec3.fromValues(.5774, -.5774, .5774), true));
            lightScene.addLight(new DirectionalLight(vec3.fromValues(1, 1, 1), 0.35, vec3.fromValues(-.25, -1, 1), false));
        }
        this._lightScenes[id] = lightScene;
        this._currentLightScene = lightScene;
        return id;
    }

    public deleteLightScene(id: string): boolean {
        if (!this._lightScenes[id]) return false;
        delete this._lightScenes[id];
        return true;
    }

    public getCurrentLightScene(): string {
        return this._currentLightScene.id;
    }

    public getLightScene(id: string): ILightScene {
        return this._lightScenes[id];
    }

    public removeLight(id: string): boolean {
        const light = this._currentLightScene.getLight(id);
        if (!light) return false;
        return this._currentLightScene.removeLight(light);
    }

    public setCurrentLightScene(id: string): boolean {
        if (!this._lightScenes[id]) return false;
        this._currentLightScene = this._lightScenes[id];
        return true;
    }

    // #endregion Public Methods (11)
}