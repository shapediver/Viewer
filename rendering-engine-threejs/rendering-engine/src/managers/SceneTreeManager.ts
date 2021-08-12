import * as THREE from 'three'
import { GeometryData, HTMLElementAnchorData, MaterialData } from '@shapediver/viewer.shared.types'
import { ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Box } from '@shapediver/viewer.shared.math'
import { EventEngine, EVENTTYPE, StateEngine } from '@shapediver/viewer.shared.services'
import { AbstractLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { SDObject } from '../types/SDObject'
import { ThreejsData } from '../types/ThreejsData'
import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager'

export class SceneTreeManager implements IManager {
    // #region Properties (5)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    private _boundingBox: Box = new Box();
    private _mainNode!: SDObject;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._scene.background = new THREE.Color('#ffffff');
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get boundingBox(): Box {
        return this._boundingBox;
    }

    public get scene() {
        return this._scene;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (4)

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

    public init(): void {}

    public isEmpty() {
        return ((this._boundingBox.min[0] === 0 && this._boundingBox.min[1] === 0 && this._boundingBox.min[2] === 0 && 
            this._boundingBox.max[0] === 0 && this._boundingBox.max[1] === 0 && this._boundingBox.max[2] === 0) || this._boundingBox.isEmpty());
    }

    public updateSceneTree(root: TreeNode, lightEngine: LightEngine): void {
        const oldBB = this._boundingBox.clone();
        this._boundingBox = new Box();

        if (!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            this._scene.add(this._mainNode);
        }

        this.updateNode(root, this._mainNode);
        this._boundingBox = root.boundingBox.clone();

        const lightScene = lightEngine.getLightScene();
        if(lightScene) {
            const lightSceneChildren = <SDObject[]>this._mainNode.children.filter(oc => lightScene.node.id === (<SDObject>oc).SDid);
            if (lightSceneChildren.length > 1) {
                this.updateNode(lightScene.node, lightSceneChildren[0]);
            } else {
                const lightSceneChild = new SDObject(lightScene.node.id, lightScene.node.version);
                this._mainNode.add(lightSceneChild)
                this.updateNode(lightScene.node, lightSceneChild);
            }
        }

        this._boundingBox.applyMatrix(root.nodeMatrix);

        if (!(this._boundingBox.min[0] === oldBB.min[0] && this._boundingBox.min[1] === oldBB.min[1] && this._boundingBox.min[2] === oldBB.min[2] && 
            this._boundingBox.max[0] === oldBB.max[0] && this._boundingBox.max[1] === oldBB.max[1] && this._boundingBox.max[2] === oldBB.max[2])) {
            if (!this._stateEngine.boundingBoxCreated.resolved)
                this._stateEngine.boundingBoxCreated.resolve(true);

            this._eventEngine.emitEvent(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, { viewerId: this._renderingEngine.id, boundingBox: {
                min: vec3.clone(this._boundingBox.min),
                max: vec3.clone(this._boundingBox.max),
            }});
        }
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    private updateNode(node: TreeNode, obj: SDObject) {
        if(node.excludeViewers.includes(this._renderingEngine.id)) return;

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
        for (const objChild of childrenToRemove) {
            obj.remove(objChild);
            objChild.traverse((o) => {
                if (o instanceof THREE.Mesh) {
                    this._renderingEngine.geometryLoader.removeFromGeometryCache(o.geometry.userData.SDid + '_' + o.geometry.userData.SDversion)
                    this._renderingEngine.materialLoader.removeFromMaterialCache(o.material.userData.SDid + '_' + o.material.userData.SDversion)
                    for (const key in o.geometry.attributes) 
                        o.geometry.deleteAttribute(key);
                    o.geometry.setIndex(null);
                    o.geometry.dispose();
                    if ((<THREE.MeshStandardMaterial>o.material).alphaMap) (<THREE.MeshStandardMaterial>o.material).alphaMap?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).aoMap) (<THREE.MeshStandardMaterial>o.material).aoMap?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).bumpMap) (<THREE.MeshStandardMaterial>o.material).bumpMap?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).map) (<THREE.MeshStandardMaterial>o.material).map?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).emissiveMap) (<THREE.MeshStandardMaterial>o.material).emissiveMap?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).metalnessMap) (<THREE.MeshStandardMaterial>o.material).metalnessMap?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).roughnessMap) (<THREE.MeshStandardMaterial>o.material).roughnessMap?.dispose()
                    if ((<THREE.MeshStandardMaterial>o.material).normalMap) (<THREE.MeshStandardMaterial>o.material).normalMap?.dispose()
                    if ((<any>o.material).specularMap) (<any>o.material).specularMap?.dispose()
                    if ((<any>o.material).glossinessMap) (<any>o.material).glossinessMap?.dispose()
                    o.material.dispose();
                }
            })
        }

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
        node.boundingBox.applyMatrix(node.nodeMatrix);
    }

    // #endregion Private Methods (1)
}