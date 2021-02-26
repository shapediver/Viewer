import { container, singleton } from "tsyringe"
import { vec3 } from "gl-matrix";
import { ILightEngine } from "..";
import { AmbientLight } from "./types/AmbientLight";
import { DirectionalLight } from "./types/DirectionalLight";
import { HemisphereLight } from "./types/HemisphereLight";
import { PointLight } from "./types/PointLight";
import { SpotLight } from "./types/SpotLight";
import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { Settings } from "@shapediver/viewer.shared.settings-engine"
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.event-engine"
import { StateEngine } from "@shapediver/viewer.shared.state-engine"
import { LightScene } from "./LightScene";
import { ILightScene } from "../interface/ILightScene";
import { AbstractLight } from "./AbstractLight";

@singleton()
export class LightEngine implements ILightEngine {
    // #region Properties (2)

    protected readonly _uuidGenerator = container.resolve(UuidGenerator);

    private _currentLightScene!: LightScene;
    private _lightScenes: { [key: string]: LightScene; } = {};
    private _eventEngine: EventEngine = container.resolve(EventEngine);
    private _stateEngine: StateEngine = container.resolve(StateEngine);
    private _settings = container.resolve(Settings).lights;

    // #endregion Properties (2)

    constructor() {
        this.createLightScene('main', true);

        if(this._stateEngine.settingsRegistered === true) {
            this.setFromSettings();
        } else {
            this._eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, () => {
                this.setFromSettings();
            })
        }
    }

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
        if (!id || this._lightScenes[id]) id = this._uuidGenerator.create();
        const lightScene = new LightScene(id);
        if (standard === true) {
            lightScene.addLight(new AmbientLight(vec3.fromValues(1,1,1), 0.5, 'ambient0'));
            lightScene.addLight(new DirectionalLight(vec3.fromValues(1,1,1), 0.75, vec3.fromValues(.5774, -.5774, .5774), true, 'directional0'));
            lightScene.addLight(new DirectionalLight(vec3.fromValues(1,1,1), 0.35, vec3.fromValues(.25, -1, 1), false, 'directional1'));
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

    public setFromSettings(): void {
        const colorDecoder = (color: any): vec3 => {
            return vec3.fromValues(1,1,1);
        }
        const pointDecoder = (p: { x: number, y: number, z: number }): vec3 => {
            return vec3.fromValues(p.x, p.y, p.z);
        }

        for(let lightScene of this._settings.lightScenes.value) {
            const ls = new LightScene(lightScene.id);
            for(let light of lightScene.lights) {
                let l: AbstractLight;
                switch(light.type) {
                    case 'directional':
                        l = new DirectionalLight(colorDecoder(light.properties.color), light.properties.intensity, pointDecoder(light.properties.direction), light.properties.castShadow, light.id);
                        break;
                    case 'hemisphere':
                        l = new HemisphereLight(colorDecoder(light.properties.skyColor), light.properties.intensity, colorDecoder(light.properties.groundColor), light.id);
                        break;
                    case 'point':
                        l = new PointLight(colorDecoder(light.properties.color), light.properties.intensity, pointDecoder(light.properties.position), light.properties.distance, light.properties.decay, light.id);
                        break;
                    case 'spot':
                        l = new SpotLight(colorDecoder(light.properties.color), light.properties.intensity, pointDecoder(light.properties.position), pointDecoder(light.properties.target), light.properties.distance, light.properties.decay, light.properties.angle, light.properties.penumbra, light.id);
                        break;
                    case 'ambient':
                    default:
                        l = new AmbientLight(colorDecoder(light.properties.color), light.properties.intensity, light.id);
                }
                ls.addLight(l);
            }
        }
        if(this._settings.lightScene.value)
            this.setCurrentLightScene(this._settings.lightScene.value)
    }

    // #endregion Public Methods (11)
}