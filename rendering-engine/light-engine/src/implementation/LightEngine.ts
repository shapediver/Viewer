import { container, singleton } from "tsyringe"
import { vec3 } from "gl-matrix";
import { ILight, ILightEngine } from "..";
import { AmbientLight } from "./types/AmbientLight";
import { DirectionalLight } from "./types/DirectionalLight";
import { HemisphereLight } from "./types/HemisphereLight";
import { PointLight } from "./types/PointLight";
import { SpotLight } from "./types/SpotLight";
import { UuidGenerator, Converter } from '@shapediver/viewer.shared.utils';
import { StateEngine, SettingsEngine } from "@shapediver/viewer.shared.services"
import { LightScene } from "./LightScene";
import { AbstractLight } from "./AbstractLight";

export class LightEngine implements ILightEngine {
    // #region Properties (6)

    private _currentLightScene!: LightScene;
    private _lightScenes: { [key: string]: LightScene; } = {};
    private _settings = (<SettingsEngine>container.resolve(SettingsEngine)).lights;
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor() {
        this.createLightScene({ id: 'default', standard: true });
    }

    // #endregion Constructors (1)

    // #region Public Methods (14)

    public addAmbientLight(properties: {color?: string, intensity?: number, id?: string}): AmbientLight {
        const light = new AmbientLight(properties.color, properties.intensity, properties.id);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addDirectionalLight(properties: {color?: string, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, id?: string}): DirectionalLight {
        const light = new DirectionalLight(properties.color, properties.intensity, properties.direction, properties.castShadow, properties.shadowMapResolution, properties.shadowMapBias, properties.id);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addHemisphereLight(properties: {color?: string, intensity?: number, groundColor?: string, id?: string}): HemisphereLight {
        const light = new HemisphereLight(properties.color, properties.intensity, properties.groundColor, properties.id);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addPointLight(properties: {color?: string, intensity?: number, position?: vec3, distance?: number, decay?: number, id?: string}): PointLight {
        const light = new PointLight(properties.color, properties.intensity, properties.position, properties.distance, properties.decay, properties.id);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addSpotLight(properties: {color?: string, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, id?: string}): SpotLight {
        const light = new SpotLight(properties.color, properties.intensity, properties.position, properties.target, properties.distance, properties.decay, properties.angle, properties.penumbra, properties.id);
        this._currentLightScene.addLight(light);
        return light;
    }

    public assignLightScene(id: string): boolean {
        if (!this._lightScenes[id]) return false;
        this._currentLightScene = this._lightScenes[id];
        return true;
    }

    public createLightScene(properties: {id?: string, standard?: boolean}): string {
        if (!properties.id || this._lightScenes[properties.id]) properties.id = this._uuidGenerator.create();
        const lightScene = new LightScene(properties.id);
        if (properties.standard === true) {
            lightScene.addLight(new AmbientLight('#ffffff', 0.5, 'ambient0'));
            lightScene.addLight(new DirectionalLight('#ffffff', 0.75, vec3.fromValues(.5774, -.5774, .5774), true, 1024, -0.00175, 'directional0'));
            lightScene.addLight(new DirectionalLight('#ffffff', 0.35, vec3.fromValues(.25, -1, 1), false, 1024, -0.00175, 'directional1'));
        }
        this._lightScenes[properties.id] = lightScene;
        this._currentLightScene = lightScene;
        return properties.id;
    }

    public getLight(id: string): ILight {
        return this._currentLightScene.getLight(id);
    }

    public getLightScene(): string {
        return this._currentLightScene.id;
    }

    public getLightSceneObject(): LightScene {
        return this._currentLightScene;
    }

    public getLightScenes(): string[] {
        return Object.keys(this._lightScenes);
    }

    public getLights(): { [key: string]: ILight; } {
        return this._currentLightScene.lights;
    }

    public removeLight(id: string): boolean {
        const light = this._currentLightScene.getLight(id);
        if (!light) return false;
        return this._currentLightScene.removeLight(id);
    }

    public removeLightScene(id: string): boolean {
        if (!this._lightScenes[id] || id === 'default') return false;
        if (this._currentLightScene.id === id)
            this.assignLightScene('default');
        delete this._lightScenes[id];
        return true;
    }

    public applySettings(): void {

        // TODO also save light scenes

        for (let lightSceneId in this._settings.lightScenes.value) {
            const ls = new LightScene(lightSceneId);
            for (let lightId in this._settings.lightScenes.value[lightSceneId].lights) {
                const light = this._settings.lightScenes.value[lightSceneId].lights[lightId];
                let l: AbstractLight;
                switch (light.type) {
                    case 'directional':
                        l = new DirectionalLight(this._converter.toColor(light.properties.color), light.properties.intensity, this._converter.toVec3(light.properties.direction), light.properties.castShadow, 1024, -0.00175, lightId);
                        break;
                    case 'hemisphere':
                        l = new HemisphereLight(this._converter.toColor(light.properties.skyColor), light.properties.intensity, this._converter.toColor(light.properties.groundColor), lightId);
                        break;
                    case 'point':
                        l = new PointLight(this._converter.toColor(light.properties.color), light.properties.intensity, this._converter.toVec3(light.properties.position), light.properties.distance, light.properties.decay, lightId);
                        break;
                    case 'spot':
                        l = new SpotLight(this._converter.toColor(light.properties.color), light.properties.intensity, this._converter.toVec3(light.properties.position), this._converter.toVec3(light.properties.target), light.properties.distance, light.properties.decay, light.properties.angle, light.properties.penumbra, lightId);
                        break;
                    case 'ambient':
                    default:
                        l = new AmbientLight(this._converter.toColor(light.properties.color), light.properties.intensity, lightId);
                }
                ls.addLight(l);
            }
            this._lightScenes[ls.id] = ls;
        }

        if (this._settings.lightScene.value)
            this.assignLightScene(this._settings.lightScene.value)
    }

    // #endregion Public Methods (14)
}