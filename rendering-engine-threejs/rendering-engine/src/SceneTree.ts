import * as THREE from 'three';

import { GeometryData, HTMLElementAnchorData, MaterialData } from '@shapediver/viewer.shared.types';
import { ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree';

import { SDObject } from './types/SDObject';
import { ThreejsData } from './types/ThreejsData';
import { Box } from '@shapediver/viewer.shared.math';
import { EventEngine, EVENTTYPE, StateEngine } from '@shapediver/viewer.shared.services';
import { AbstractLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { vec3 } from 'gl-matrix';
import { container } from 'tsyringe';
import { RenderingEngine } from './RenderingEngine';

export class SceneTree {
    // #region Properties (7)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    private _boundingBox: Box = new Box();
    private _mainNode!: SDObject;


    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Properties (7)

    // #region Public Accessors (2)

    public get boundingBox(): Box {
        return this._boundingBox;
    }

    public get scene() {
        return this._scene;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (2)

    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
    public convertData(data: ITreeNodeData, obj: SDObject, realObject: TreeNode): Box {
        let dataChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === data.id && (<SDObject>oc).SDversion === data.version);

        if (!dataChild)
            dataChild = new SDObject(data.id, data.version);

        obj.add(dataChild);

        switch (true) {
            case data instanceof GeometryData:
                return this._renderingEngine.geometryLoader.load(<GeometryData>data, dataChild, realObject);
            case data instanceof ThreejsData:
                dataChild.add(<SDObject>(<ThreejsData>data).obj);
                break;
            case data instanceof MaterialData:
                break;
            case data instanceof AbstractLight:
                this._renderingEngine.lightLoader.load(<AbstractLight>data, dataChild, this._scene, this._boundingBox);
                break;
            case data instanceof HTMLElementAnchorData:
                this._renderingEngine.htmlElementAnchorLoader.load(<HTMLElementAnchorData>data);
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
        return new Box();
    }

    public updateSceneTree(root: TreeNode, lightEngine: LightEngine): void {
        const oldBB = this._boundingBox.clone();
        this._boundingBox = new Box();

        this._renderingEngine.geometryLoader.emptyGeometryCache();
        if (!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            this._scene.add(this._mainNode);
        }

        this.updateNode(root, this._mainNode);
        this._boundingBox = root.boundingBox.clone();

        const lightScene = lightEngine.getLightSceneObject();
        const lightSceneChildren = <SDObject[]>this._mainNode.children.filter(oc => lightScene.node.id === (<SDObject>oc).SDid);
        if (lightSceneChildren.length > 1) {
            this.updateNode(lightScene.node, lightSceneChildren[0]);
        } else {
            const lightSceneChild = new SDObject(lightScene.node.id, lightScene.node.version);
            this._mainNode.add(lightSceneChild)
            this.updateNode(lightScene.node, lightSceneChild);
        }

        if (!(vec3.equals(oldBB.min, this._boundingBox.min) && vec3.equals(oldBB.max, this._boundingBox.max))) {
            if (!this._stateEngine.boundingBoxCreated.resolved)
                this._stateEngine.boundingBoxCreated.resolve(true);

            this._eventEngine.emitEvent(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, this._boundingBox);
        }
    }

    public isEmpty() {
        return vec3.equals(this._boundingBox.min, vec3.create()) && vec3.equals(this._boundingBox.max, vec3.create());
    }

    // #endregion Public Methods (2)

    // #region Private Methods (1)

    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    private updateNode(node: TreeNode, obj: SDObject) {
        obj.applyTransformation(node.nodeMatrix);
        node.boundingBox = new Box();

        for (let i = 0, len = node.data.length; i < len; i++) {
            const bb = this.convertData(node.data[i], obj, node);
            node.boundingBox.union(bb)
        }

        const nodeIds: string[] = []
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if(child) nodeIds.push(child.id)
        }
        const dataIds = node.data.map(d => d.id);
        const dataVersions = node.data.map(d => d.version);
        const childrenToRemove = obj.children.filter(oc => (!nodeIds.includes((<SDObject>oc).SDid)) && !(dataIds.includes((<SDObject>oc).SDid) && dataVersions.includes((<SDObject>oc).SDversion)));

        // remove children that are not anymore in there
        for (const objChild of childrenToRemove) 
            obj.remove(objChild);

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            if(!nodeChild) continue;
            const objChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);

            if (!objChild) {
                const newChild = new SDObject(nodeChild.id, nodeChild.version);
                obj.add(newChild);
                this.updateNode(nodeChild, newChild);
            } else if (objChild.SDversion !== nodeChild.version) {
                this.updateNode(nodeChild, objChild);
            }
            node.boundingBox.union(nodeChild.boundingBox);
        }
    }

    // #endregion Private Methods (1)
}