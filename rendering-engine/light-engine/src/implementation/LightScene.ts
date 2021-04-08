import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ILight } from "../interface/ILight";
import { ILightScene } from "../interface/ILightScene";
import { AbstractLight } from "./AbstractLight";

export class LightScene implements ILightScene {
    // #region Properties (2)

    private readonly _lights: { [key: string]: ILight; } = {};
    private readonly _node: TreeNode;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _id: string) {
        this._node = new TreeNode(_id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    public get id(): string {
        return this._id;
    }

    public get lights(): { [key: string]: AbstractLight; } {
        return <{ [key: string]: AbstractLight; }>this._lights
    }

    public get node(): TreeNode {
        return this._node;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (3)

    public addLight(light: AbstractLight): void {
        const node = new TreeNode(light.id);
        node.data.push(light);
        this._node.addChild(node)
        this._lights[light.id] = light;
        
        this._node.updateVersion();
    }

    public getLight(id: string): AbstractLight {
        return <AbstractLight>this._lights[id];
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
        return true;
    }

    // #endregion Public Methods (3)
}