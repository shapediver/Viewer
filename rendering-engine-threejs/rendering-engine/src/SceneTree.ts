import * as THREE from 'three';

import { GeometryData, MaterialData } from '@shapediver/viewer.shared.types';
import { ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree';

import { GeometryLoader } from './loaders/GeometryLoader';
import { SDObject } from './types/SDObject';
import { ThreejsData } from './types/ThreejsData';
import { Box } from '@shapediver/viewer.shared.math';
import { EventEngine, EVENTTYPE, StateEngine } from '@shapediver/viewer.shared.services';
import { AbstractLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine';
import { vec3 } from 'gl-matrix';
import { container } from 'tsyringe';
import { LightLoader } from './loaders/LightLoader';
import { MaterialLoader } from './loaders/MaterialLoader';

export class SceneTree {
    // #region Properties (7)

    private readonly _eventEngine: EventEngine = container.resolve(EventEngine);
    private readonly _geometryLoader: GeometryLoader = new GeometryLoader();
    private readonly _lightLoader: LightLoader = new LightLoader();
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = container.resolve(StateEngine);
    private readonly _materialLoader = new MaterialLoader();

    private _boundingBox: Box = new Box();
    private _mainNode!: SDObject;

    // #endregion Properties (7)

    // #region Public Accessors (2)

    public get boundingBox(): Box {
        return this._boundingBox;
    }

    public get materialLoader(): MaterialLoader {
        return this._materialLoader;
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
    public convertData(data: ITreeNodeData, obj: SDObject): void {
        let dataChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === data.id && (<SDObject>oc).SDversion === data.version);

        if (!dataChild)
            dataChild = new SDObject(data.id, data.version);

        obj.add(dataChild);

        switch (true) {
            case data instanceof GeometryData:
                this._geometryLoader.load(<GeometryData>data, dataChild, this._boundingBox, this._materialLoader);
                break;
            case data instanceof ThreejsData:
                dataChild.add(<SDObject>(<ThreejsData>data).obj);
                break;
            case data instanceof MaterialData:
                // we only store it here to retrieve it for material assignment later on
                // this._helper.addData(this.createMaterial(<SceneGraphMaterialData>data), dataChild);
                break;
            case data instanceof AbstractLight:
                this._lightLoader.load(<AbstractLight>data, dataChild, this._scene, this._boundingBox);
                // we only store it here to retrieve it for material assignment later on
                // this._helper.addData(this.createMaterial(<SceneGraphMaterialData>data), dataChild);
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    public updateSceneTree(root: TreeNode, lightEngine: LightEngine): void {
        const oldBB = this._boundingBox.clone();

        this._geometryLoader.emptyGeometryCache();
        if (!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            this._scene.add(this._mainNode);
        }

        this.updateNode(root, this._mainNode);

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
        console.log(this._boundingBox)
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

        for (let i = 0, len = node.data.length; i < len; i++) {
            this.convertData(node.data[i], obj);
        }

        const nodeIds: string[] = []
        for (let i = 0; i < node.getNumberOfChildren(); i++) {
            nodeIds.push(node.getChildAt(i).id)
        }
        const dataIds = node.data.map(d => d.id);
        const dataVersions = node.data.map(d => d.version);
        const childrenToRemove = obj.children.filter(oc => (!nodeIds.includes((<SDObject>oc).SDid)) && !(dataIds.includes((<SDObject>oc).SDid) && dataVersions.includes((<SDObject>oc).SDversion)));

        // remove children that are not anymore in there
        for (const objChild of childrenToRemove) {
            // TODO BB removal
            obj.remove(objChild);
        }

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.getNumberOfChildren(); i < len; i++) {
            const nodeChild = node.getChildAt(i);
            const objChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);

            if (!objChild) {
                const newChild = new SDObject(nodeChild.id, nodeChild.version);
                obj.add(newChild);
                this.updateNode(nodeChild, newChild);
            } else if (objChild.SDversion !== nodeChild.version) {
                this.updateNode(nodeChild, objChild);
            }
        }
    }

    // #endregion Private Methods (1)
}