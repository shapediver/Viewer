import { container, singleton } from 'tsyringe'
import { vec3 } from 'gl-matrix'
import { Converter, UuidGenerator } from '@shapediver/viewer.shared.utils'
import { SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'

import { AmbientLight } from './types/AmbientLight'
import { DirectionalLight } from './types/DirectionalLight'
import { HemisphereLight } from './types/HemisphereLight'
import { PointLight } from './types/PointLight'
import { SpotLight } from './types/SpotLight'
import { LightScene } from './LightScene'
import { AbstractLight } from './AbstractLight'
import { ILightEngine } from '../interface/ILightEngine'
import { ILight, LIGHTTYPE } from '../interface/ILight'
import { ILightScene } from '../interface/ILightScene'

export class LightEngine implements ILightEngine {
    // #region Properties (6)

    private _currentLightScene!: LightScene;
    private _lightScenes: { [key: string]: LightScene; } = {};

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    private readonly _standardLightScene: LightScene;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor() {
        this._standardLightScene = <LightScene>this.createLightScene({ name: 'standard', standard: true });
        this._lightScenes[this._standardLightScene.id] = this._standardLightScene;
    }

    // #endregion Constructors (1)

    // #region Public Methods (14)

    public addAmbientLight(properties: {color?: string, intensity?: number, name?: string}): AmbientLight {
        const light = new AmbientLight(properties);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addDirectionalLight(properties: {color?: string, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, name?: string}): DirectionalLight {
        const light = new DirectionalLight(properties);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addHemisphereLight(properties: {color?: string, intensity?: number, groundColor?: string, name?: string}): HemisphereLight {
        const light = new HemisphereLight(properties);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addPointLight(properties: {color?: string, intensity?: number, position?: vec3, distance?: number, decay?: number, name?: string}): PointLight {
        const light = new PointLight(properties);
        this._currentLightScene.addLight(light);
        return light;
    }

    public addSpotLight(properties: {color?: string, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, name?: string}): SpotLight {
        const light = new SpotLight(properties);
        this._currentLightScene.addLight(light);
        return light;
    }

    public assignLightScene(id: string): boolean {
        if (!this._lightScenes[id]) {
            for(let lightSceneId in this._lightScenes) {
                const lightScene = this._lightScenes[lightSceneId];
                const lightSceneName = lightScene.name || lightSceneId;
                if(lightSceneName === id) return this.assignLightScene(lightSceneId);
            }
            return false;
        }
        this._currentLightScene = this._lightScenes[id];
        return true;
    }

    public createLightScene(properties: {name?: string, standard?: boolean}): ILightScene {
        const lightSceneId = this._uuidGenerator.create();
        const lightScene = new LightScene({id: lightSceneId, name: properties.name});
        if (properties.standard === true) {
            lightScene.addLight(new AmbientLight({color: '#ffffff', intensity: 0.5, name: 'ambient0'}));
            lightScene.addLight(new DirectionalLight({color: '#ffffff', intensity: 0.75, direction: vec3.fromValues(.5774, -.5774, .5774), castShadow: true, name: 'directional0'}));
            lightScene.addLight(new DirectionalLight({color: '#ffffff', intensity: 0.35, direction: vec3.fromValues(.25, -1, 1), castShadow: false, name: 'directional1'}));
        }
        this._lightScenes[lightSceneId] = lightScene;
        this._currentLightScene = lightScene;
        return lightScene;
    }

    public getLight(id: string): ILight {
        return this._currentLightScene.getLight(id);
    }

    public getLightScene(id?: string): ILightScene {
        if(id && this._lightScenes[id]) return this._lightScenes[id];
        return this._currentLightScene;
    }

    public getLightSceneObject(): LightScene {
        return this._currentLightScene;
    }

    public getLightScenes(): {[key: string]: ILightScene} {
        return this._lightScenes;
    }

    public getLights(): { [key: string]: ILight; } {
        return this._currentLightScene.lights;
    }

    public removeLight(id: string): boolean {
        let light = this._currentLightScene.getLight(id);
        if (!light) {
            for(let ls in this._lightScenes) {
                light = this._lightScenes[ls].getLight(id);
                if(light) 
                    return this._lightScenes[ls].removeLight(id);
            }
            return false;
        } 
        return this._currentLightScene.removeLight(id);
    }

    public removeLightScene(id: string): boolean {
        if (id === this._standardLightScene.id) return false;
        if (!this._lightScenes[id]) {
            for(let lightSceneId in this._lightScenes) {
                const lightScene = this._lightScenes[lightSceneId];
                const lightSceneName = lightScene.name || lightSceneId;
                if(lightSceneName === id) return this.removeLightScene(lightSceneId);
            }
            return false;
        }
        if (this._currentLightScene.id === id)
            this.assignLightScene(this._standardLightScene.id);
        delete this._lightScenes[id];
        return true;
    }

    public saveSettings() {
        this._settingsEngine.lights.lightScene.value = this.getLightScene().id;
        const converted: {
            [key: string]: {
                id: string,
                name: string;
                lights: {
                    [key: string]: {
                        id: string, 
                        name?: string,
                        type: LIGHTTYPE,
                        order?: number,
                        properties: any
                    }
                }
            }
        } = {};
        for(let lightSceneId in this._lightScenes) {
            const lightScene = this._lightScenes[lightSceneId];
            const lightSceneName = lightScene.name || lightSceneId;
            converted[lightSceneId] = {
                id: lightSceneId,
                name: lightSceneName,
                lights: {}
            };
            for(let lightId in lightScene.lights) {
                const light = lightScene.lights[lightId];
                converted[lightSceneId].lights[lightId] = {
                    id: lightId,
                    name: light.name,
                    type: light.type,
                    properties: {}
                }
                if(light.order !== undefined)
                    converted[lightSceneId].lights[lightId].order = light.order;
                
                switch (light.type) {
                    case LIGHTTYPE.DIRECTIONAL:
                        converted[lightSceneId].lights[lightId].properties = {
                            color: light.color,
                            intensity: light.intensity,
                            direction: { x: (<DirectionalLight>light).direction[0], y: (<DirectionalLight>light).direction[1], z: (<DirectionalLight>light).direction[2] },
                            castShadow: (<DirectionalLight>light).castShadow,
                            shadowMapResolution: (<DirectionalLight>light).shadowMapResolution,
                            shadowMapBias: (<DirectionalLight>light).shadowMapBias
                        }
                        break;
                    case LIGHTTYPE.HEMISPHERE:
                        converted[lightSceneId].lights[lightId].properties = {
                            skyColor: light.color,
                            intensity: light.intensity,
                            groundColor: (<HemisphereLight>light).groundColor
                        }
                        break;
                    case LIGHTTYPE.POINT:
                        converted[lightSceneId].lights[lightId].properties = {
                            color: light.color,
                            intensity: light.intensity,
                            position: { x: (<PointLight>light).position[0], y: (<PointLight>light).position[1], z: (<PointLight>light).position[2] },
                            distance: (<PointLight>light).distance,
                            decay: (<PointLight>light).decay
                        }
                        break;
                    case LIGHTTYPE.SPOT:
                        converted[lightSceneId].lights[lightId].properties = {
                            color: light.color,
                            intensity: light.intensity,
                            position: { x: (<SpotLight>light).position[0], y: (<SpotLight>light).position[1], z: (<SpotLight>light).position[2] },
                            target: { x: (<SpotLight>light).target[0], y: (<SpotLight>light).target[1], z: (<SpotLight>light).target[2] },
                            distance: (<SpotLight>light).distance,
                            decay: (<SpotLight>light).decay,
                            angle: (<SpotLight>light).angle,
                            penumbra: (<SpotLight>light).penumbra
                        }
                        break;
                    case LIGHTTYPE.AMBIENT:
                    default:
                        converted[lightSceneId].lights[lightId].properties = {
                            color: light.color,
                            intensity: light.intensity
                        }
                }
            }
        }
        this._settingsEngine.lights.lightScenes.value = converted;
    }

    public applySettings(): void {
        this._lightScenes = {};
        let standardLS = false;

        for (let lightSceneId in this._settingsEngine.lights.lightScenes.value) {
            const lightSceneUUID = this._uuidGenerator.validate(lightSceneId) ? lightSceneId : this._uuidGenerator.create();
            const lightSceneName = this._settingsEngine.lights.lightScenes.value[lightSceneId].name ? this._settingsEngine.lights.lightScenes.value[lightSceneId].name : lightSceneId;
            if(lightSceneName === 'default' || lightSceneName === 'standard') standardLS = true;
            const ls = new LightScene({id: lightSceneUUID, name: lightSceneName});
            for (let lightId in this._settingsEngine.lights.lightScenes.value[lightSceneId].lights) {
                const lightUUID = this._uuidGenerator.validate(lightId) ? lightId : this._uuidGenerator.create();
                const light = this._settingsEngine.lights.lightScenes.value[lightSceneId].lights[lightId];
                let l: AbstractLight;
                switch (light.type) {
                    case LIGHTTYPE.DIRECTIONAL:
                        l = new DirectionalLight({
                            color: this._converter.toColor(light.properties.color), 
                            intensity: light.properties.intensity, 
                            direction: this._converter.toVec3(light.properties.direction), 
                            castShadow: light.properties.castShadow, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHTTYPE.HEMISPHERE:
                        l = new HemisphereLight({
                            color: this._converter.toColor(light.properties.skyColor), 
                            intensity: light.properties.intensity, 
                            groundColor: this._converter.toColor(light.properties.groundColor), 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHTTYPE.POINT:
                        l = new PointLight({
                            color: this._converter.toColor(light.properties.color), 
                            intensity: light.properties.intensity, 
                            position: this._converter.toVec3(light.properties.position), 
                            distance: light.properties.distance, 
                            decay: light.properties.decay, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHTTYPE.SPOT:
                        l = new SpotLight({
                            color: this._converter.toColor(light.properties.color), 
                            intensity: light.properties.intensity, 
                            position: this._converter.toVec3(light.properties.position), 
                            target: this._converter.toVec3(light.properties.target), 
                            distance: light.properties.distance, 
                            decay: light.properties.decay, 
                            angle: light.properties.angle, 
                            penumbra: light.properties.penumbra, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHTTYPE.AMBIENT:
                    default:
                        l = new AmbientLight({
                            color: this._converter.toColor(light.properties.color), 
                            intensity: light.properties.intensity, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                }
                ls.addLight(l);
            }
            this._lightScenes[ls.id] = ls;
        }

        if(!standardLS)
            this._lightScenes[this._standardLightScene.id] = this._standardLightScene;

        if (this._settingsEngine.lights.lightScene.value)
            this.assignLightScene(this._settingsEngine.lights.lightScene.value);

        if(!Object.keys(this._lightScenes).includes(this.getLightScene().id))
            this.assignLightScene('standard');
    }

    // #endregion Public Methods (14)
}