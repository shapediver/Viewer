import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { vec3 } from 'gl-matrix';

import { ILight } from '../interface/ILight'
import { ILightScene } from '../interface/ILightScene'
import { AbstractLight } from './AbstractLight'
import { AmbientLight } from './types/AmbientLight';
import { DirectionalLight } from './types/DirectionalLight';
import { HemisphereLight } from './types/HemisphereLight';
import { PointLight } from './types/PointLight';
import { SpotLight } from './types/SpotLight';

export class LightScene implements ILightScene {
    // #region Properties (5)

    private readonly _id: string;
    private readonly _lights: { [key: string]: ILight; } = {};
    private readonly _node: ITreeNode;

    private _name: string | undefined;
    private _update?: () => void;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: IRenderingEngine, properties: {id: string, name?: string}) {
        this._id = properties.id;
        this._name = properties.name;
        this._node = new TreeNode(properties.name || properties.id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    public get id(): string {
        return this._id;
    }

    public get lights(): { [key: string]: AbstractLight; } {
        return <{ [key: string]: AbstractLight; }>this._lights
    }

    public get name(): string | undefined {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;
    }

    public get node(): ITreeNode {
        return this._node;
    }
    
    public get update(): (() => void) | undefined {
        return this._update;
    }

    public set update(value: (() => void) | undefined) {
        this._update = value;
    }

    // #endregion Public Accessors (5)

    // #region Public Methods (8)

    public addAmbientLight(properties: {color?: string, intensity?: number, name?: string}): AmbientLight {
        const light = new AmbientLight(properties);
        this.addLight(light);
        return light;
    }

    public addDirectionalLight(properties: {color?: string, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, name?: string}): DirectionalLight {
        const light = new DirectionalLight(properties);
        this.addLight(light);
        return light;
    }

    public addHemisphereLight(properties: {color?: string, intensity?: number, groundColor?: string, name?: string}): HemisphereLight {
        const light = new HemisphereLight(properties);
        this.addLight(light);
        return light;
    }

    public addLight(light: AbstractLight): void {
        const node = new TreeNode(light.id);
        node.data.push(light);
        this._node.addChild(node)
        this._lights[light.id] = light;
        
        this._node.updateVersion();
        if(this._update) this._update();
    }

    public addPointLight(properties: {color?: string, intensity?: number, position?: vec3, distance?: number, decay?: number, name?: string}): PointLight {
        const light = new PointLight(properties);
        this.addLight(light);
        return light;
    }

    public addSpotLight(properties: {color?: string, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, name?: string}): SpotLight {
        const light = new SpotLight(properties);
        this.addLight(light);
        return light;
    }

    public removeLight(id: string): boolean {
        if (!this._lights[id]) return false;

        for(let i = 0; i < this._node.children.length; i++) {
            const node = this._node.children[i];
            if(node && node.name === id) {
                this._node.removeChild(node);
                break;
            }
        }

        delete this._lights[id];
        this._node.updateVersion();
        if(this._update) this._update();
        return true;
    }

    // #endregion Public Methods (8)
}