import { container, singleton } from 'tsyringe'
import { vec3 } from 'gl-matrix'
import { Converter, UuidGenerator, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'

import { AmbientLight } from './types/AmbientLight'
import { DirectionalLight } from './types/DirectionalLight'
import { HemisphereLight } from './types/HemisphereLight'
import { PointLight } from './types/PointLight'
import { SpotLight } from './types/SpotLight'
import { LightScene } from './LightScene'
import { AbstractLight } from './AbstractLight'
import { ILightEngine } from '../interface/ILightEngine'
import { ILight, LIGHT_TYPE } from '../interface/ILight'
import { ILightScene } from '../interface/ILightScene'
import { IAmbientLightPropertiesV3, IDirectionalLightPropertiesV3, IHemisphereLightPropertiesV3, ILightSceneSettingsV3, IPointLightPropertiesV3, ISpotLightPropertiesV3 } from '@shapediver/viewer.settings'
import { ITree, ITreeNode, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine'

export class LightEngine implements ILightEngine {
    // #region Properties (6)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _lightNode: ITreeNode = new TreeNode('lights');
    private readonly _tree: ITree = <ITree>container.resolve(Tree);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _lightScene!: LightScene;
    private _lightScenes: { [key: string]: LightScene; } = {};
    private _update?: () => void;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: IRenderingEngine) {
        this._tree.root.addChild(this._lightNode);
        this._lightNode.restrictViewports = [this._renderingEngine.id];
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get lightScene(): LightScene | null {
        return this._lightScene;
    }

    public get lightScenes(): {
        [key: string]: LightScene
    } {
        return this._lightScenes;
    }

    public get update(): (() => void) | undefined {
        return this._update;
    }

    public set update(value: (() => void) | undefined) {
        this._update = value;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (6)

    public applySettings(settingsEngine: SettingsEngine): void {
        this._lightScenes = {};

        for (let lightSceneId in settingsEngine.light.lightScenes) {
            const lightSceneUUID = this._uuidGenerator.validate(lightSceneId) ? lightSceneId : this._uuidGenerator.create();
            const lightSceneName = settingsEngine.light.lightScenes[lightSceneId].name ? settingsEngine.light.lightScenes[lightSceneId].name : lightSceneId;
            const ls = new LightScene(this._renderingEngine, {id: lightSceneUUID, name: lightSceneName});
            for (let lightId in settingsEngine.light.lightScenes[lightSceneId].lights) {
                const lightUUID = this._uuidGenerator.validate(lightId) ? lightId : this._uuidGenerator.create();
                const light = settingsEngine.light.lightScenes[lightSceneId].lights[lightId];
                let l: AbstractLight;
                switch (light.type) {
                    case LIGHT_TYPE.DIRECTIONAL:
                        l = new DirectionalLight({
                            color: this._converter.toColor((<IDirectionalLightPropertiesV3>light.properties).color), 
                            intensity: (<IDirectionalLightPropertiesV3>light.properties).intensity, 
                            direction: this._converter.toVec3((<IDirectionalLightPropertiesV3>light.properties).direction), 
                            castShadow: (<IDirectionalLightPropertiesV3>light.properties).castShadow, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHT_TYPE.HEMISPHERE:
                        l = new HemisphereLight({
                            color: this._converter.toColor((<IHemisphereLightPropertiesV3>light.properties).skyColor), 
                            intensity: (<IHemisphereLightPropertiesV3>light.properties).intensity, 
                            groundColor: this._converter.toColor((<IHemisphereLightPropertiesV3>light.properties).groundColor), 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHT_TYPE.POINT:
                        l = new PointLight({
                            color: this._converter.toColor((<IPointLightPropertiesV3>light.properties).color), 
                            intensity: (<IPointLightPropertiesV3>light.properties).intensity, 
                            position: this._converter.toVec3((<IPointLightPropertiesV3>light.properties).position), 
                            distance: (<IPointLightPropertiesV3>light.properties).distance, 
                            decay: (<IPointLightPropertiesV3>light.properties).decay, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHT_TYPE.SPOT:
                        l = new SpotLight({
                            color: this._converter.toColor((<ISpotLightPropertiesV3>light.properties).color), 
                            intensity: (<ISpotLightPropertiesV3>light.properties).intensity, 
                            position: this._converter.toVec3((<ISpotLightPropertiesV3>light.properties).position), 
                            target: this._converter.toVec3((<ISpotLightPropertiesV3>light.properties).target), 
                            distance: (<ISpotLightPropertiesV3>light.properties).distance, 
                            decay: (<ISpotLightPropertiesV3>light.properties).decay, 
                            angle: (<ISpotLightPropertiesV3>light.properties).angle, 
                            penumbra: (<ISpotLightPropertiesV3>light.properties).penumbra, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                        break;
                    case LIGHT_TYPE.AMBIENT:
                    default:
                        l = new AmbientLight({
                            color: this._converter.toColor((<IAmbientLightPropertiesV3>light.properties).color), 
                            intensity: (<IAmbientLightPropertiesV3>light.properties).intensity, 
                            name: light.name ? light.name : lightId,
                            order: light.order,
                            id: lightUUID
                        });
                }
                ls.addLight(l);
            }
            this._lightScenes[ls.id] = ls;
        }

        // there is a light scene but no id is saved (old viewer)
        if(settingsEngine.light.lightSceneId === undefined && Object.values(settingsEngine.light.lightScenes).length > 0) {
            const res = this.assignLightScene(Object.keys(settingsEngine.light.lightScenes)[0]);
            if(res === false){
                const ls = <LightScene>this.createLightScene({ name: settingsEngine.light.lightSceneId === 'default' ? 'default' : 'standard' });
                ls.addLight(new AmbientLight({color: '#ffffff', intensity: 0.5, name: 'ambient0'}));
                ls.addLight(new DirectionalLight({color: '#ffffff', intensity: 0.75, direction: vec3.fromValues(.5774, -.5774, .5774), castShadow: true, name: 'directional0'}));
                ls.addLight(new DirectionalLight({color: '#ffffff', intensity: 0.35, direction: vec3.fromValues(.25, -1, 1), castShadow: false, name: 'directional1'}));
                this._lightScenes[ls.id] = ls;
            }
        } // there is no standard light scene in the light scenes, but a light scene name is specified (old viewer)
        else if (settingsEngine.light.lightSceneId) {
            const res = this.assignLightScene(settingsEngine.light.lightSceneId);
            if(res === false){
                const ls = <LightScene>this.createLightScene({ name: settingsEngine.light.lightSceneId === 'default' ? 'default' : 'standard' });
                ls.addLight(new AmbientLight({color: '#ffffff', intensity: 0.5, name: 'ambient0'}));
                ls.addLight(new DirectionalLight({color: '#ffffff', intensity: 0.75, direction: vec3.fromValues(.5774, -.5774, .5774), castShadow: true, name: 'directional0'}));
                ls.addLight(new DirectionalLight({color: '#ffffff', intensity: 0.35, direction: vec3.fromValues(.25, -1, 1), castShadow: false, name: 'directional1'}));
                this._lightScenes[ls.id] = ls;
            }
        } 

        if(this._update) this._update();
    }

    public assignLightScene(id: string): boolean {
        if (!this._lightScenes[id]) {
            for(let lightSceneId in this._lightScenes) {
                const lightScene = this._lightScenes[lightSceneId];
                const lightSceneName = lightScene.name || lightSceneId;
                if(lightSceneName === id) {
                    const res = this.assignLightScene(lightSceneId);
                    return res;
                }
            }
            return false;
        }
        this._lightScene = this._lightScenes[id];
        while(this._lightNode.children.length > 0)
            this._lightNode.removeChild(this._lightNode.children[0]);
        this._lightNode.addChild(this._lightScene!.node);
        this._lightNode.updateVersion();
        
        return true;
    }

    public close(): void {
        this._tree.root.removeChild(this._lightNode);
    }

    public createLightScene(properties: {name?: string, standard?: boolean}): ILightScene {
        const lightSceneId = this._uuidGenerator.create();
        const lightScene = new LightScene(this._renderingEngine, {id: lightSceneId, name: properties.name});
        if (properties.standard === true) {
            lightScene.addLight(new DirectionalLight({color: '#ffffff', intensity: 2.5, direction: vec3.fromValues(.5774, -.5774, .5774), castShadow: true, name: 'directional0'}));
            lightScene.addLight(new DirectionalLight({color: '#ffffff', intensity: 1, direction: vec3.fromValues(-.5774, -.5774, .5774), castShadow: false, name: 'directional1'}));
        }
        this._lightScenes[lightSceneId] = lightScene;
        this._lightScene = lightScene;
        while(this._lightNode.children.length > 0)
            this._lightNode.removeChild(this._lightNode.children[0]);
        this._lightNode.addChild(this._lightScene!.node)
        this._lightNode.updateVersion();

        if(this._update) this._update();
        return lightScene;
    }

    public removeLightScene(id: string): boolean {
        if (!this._lightScenes[id]) {
            for(let lightSceneId in this._lightScenes) {
                const lightScene = this._lightScenes[lightSceneId];
                const lightSceneName = lightScene.name || lightSceneId;
                if(lightSceneName === id) {
                    const res = this.removeLightScene(lightSceneId);
                    return res;
                }
            }
            return false;
        }

        if(this._lightScene && this._lightScene.id === id)
            (<any>this._lightScene) = undefined;
        delete this._lightScenes[id];

        while(this._lightNode.children.length > 0)
            this._lightNode.removeChild(this._lightNode.children[0]);
        this._lightNode.updateVersion();

        if(this._update) this._update();
        return true;
    }

    public saveSettings(settingsEngine: SettingsEngine) {
        settingsEngine.light.lightSceneId = this.lightScene ? this.lightScene.id : undefined;
        
        const converted: ILightSceneSettingsV3 = {};
        for(let lightSceneId in this._lightScenes) {
            const lightScene = this._lightScenes[lightSceneId];
            const lightSceneName = lightScene.name || lightSceneId;
            converted[lightSceneId] = {
                name: lightSceneName,
                lights: {}
            };
            for(let lightId in lightScene.lights) {
                const light = lightScene.lights[lightId];
                
                let properties;
                switch (light.type) {
                    case LIGHT_TYPE.DIRECTIONAL:
                        properties = {
                            color: light.color,
                            intensity: light.intensity,
                            direction: { x: (<DirectionalLight>light).direction[0], y: (<DirectionalLight>light).direction[1], z: (<DirectionalLight>light).direction[2] },
                            castShadow: (<DirectionalLight>light).castShadow,
                            shadowMapResolution: (<DirectionalLight>light).shadowMapResolution,
                            shadowMapBias: (<DirectionalLight>light).shadowMapBias
                        }
                        break;
                    case LIGHT_TYPE.HEMISPHERE:
                        properties = {
                            skyColor: light.color,
                            intensity: light.intensity,
                            groundColor: (<HemisphereLight>light).groundColor
                        }
                        break;
                    case LIGHT_TYPE.POINT:
                        properties = {
                            color: light.color,
                            intensity: light.intensity,
                            position: { x: (<PointLight>light).position[0], y: (<PointLight>light).position[1], z: (<PointLight>light).position[2] },
                            distance: (<PointLight>light).distance,
                            decay: (<PointLight>light).decay
                        }
                        break;
                    case LIGHT_TYPE.SPOT:
                        properties = {
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
                    case LIGHT_TYPE.AMBIENT:
                    default:
                        properties = {
                            color: light.color,
                            intensity: light.intensity
                        }
                }
                converted[lightSceneId].lights[lightId] = {
                    name: light.name,
                    type: light.type,
                    properties
                }
                if(light.order !== undefined)
                    converted[lightSceneId].lights[lightId].order = light.order;
            }
        }
        settingsEngine.light.lightScenes = converted;
    }

    // #endregion Public Methods (6)
}