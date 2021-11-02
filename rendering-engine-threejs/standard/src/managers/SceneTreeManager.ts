import * as THREE from 'three'
import { AnimationData, GeometryData, HTMLElementAnchorData, MaterialData } from '@shapediver/viewer.shared.types'
import { ITreeNodeData, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Box } from '@shapediver/viewer.shared.math'
import { EventEngine, EVENTTYPE, StateEngine } from '@shapediver/viewer.shared.services'
import { AbstractLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import { mat4, quat, vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { SDNode } from '../types/SDNode'
import { ThreejsData } from '../types/ThreejsData'
import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager'
import { SDData, SD_DATA_TYPE } from '../types/SDData'

export class SceneTreeManager implements IManager {
    // #region Properties (5)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: Tree = <Tree>container.resolve(Tree);

    private _boundingBox: Box = new Box();
    private _mainNode!: SDNode;

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

    public init(): void {}

    public isEmpty() {
        return ((this._boundingBox.min[0] === 0 && this._boundingBox.min[1] === 0 && this._boundingBox.min[2] === 0 && 
            this._boundingBox.max[0] === 0 && this._boundingBox.max[1] === 0 && this._boundingBox.max[2] === 0) || this._boundingBox.isEmpty());
    }

    public updateSceneTree(root: TreeNode, lightEngine: LightEngine): void {
        const oldBB = this._boundingBox.clone();
        this._boundingBox = new Box();
        this._renderingEngine.lightLoader.shadowMapCount = 0;

        if (!this._mainNode) {
            this._mainNode = new SDNode(root.id, root.version);
            this._scene.add(this._mainNode);
        }

        this.updateNode(root, this._mainNode);
        this._boundingBox = root.boundingBox.clone();

        const lightScene = lightEngine.lightScene;
        if(lightScene) {
            const lightSceneChildren = <SDNode[]>this._mainNode.children.filter(oc => lightScene.node.id === (<SDNode>oc).SDid);
            if (lightSceneChildren.length > 1) {
                this.updateNode(lightScene.node, lightSceneChildren[0]);
            } else {
                const lightSceneChild = new SDNode(lightScene.node.id, lightScene.node.version);
                this._mainNode.add(lightSceneChild)
                this.updateNode(lightScene.node, lightSceneChild);
            }
        }

        if(!this._boundingBox.isEmpty())
            this._boundingBox.applyMatrix(root.nodeMatrix);

        if (!(this._boundingBox.min[0] === oldBB.min[0] && this._boundingBox.min[1] === oldBB.min[1] && this._boundingBox.min[2] === oldBB.min[2] && 
            this._boundingBox.max[0] === oldBB.max[0] && this._boundingBox.max[1] === oldBB.max[1] && this._boundingBox.max[2] === oldBB.max[2]) && !this._boundingBox.isEmpty()) {
            if (!this._stateEngine.boundingBoxCreated.resolved)
                this._stateEngine.boundingBoxCreated.resolve(true);

            this._eventEngine.emitEvent(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, { viewerId: this._renderingEngine.id, boundingBox: {
                min: vec3.clone(this._boundingBox.min),
                max: vec3.clone(this._boundingBox.max),
            }});
        }

        this._renderingEngine.renderingManager.evaluateTextureUnitCount(this._renderingEngine.lightLoader.shadowMapCount + this._renderingEngine.materialLoader.maxMapCount);
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    public updateNodeTransformations(node: TreeNode = this._tree.root, obj: SDNode = this._mainNode) {
        if(!node || !obj) return;
        if(node.excludeViewers.includes(this._renderingEngine.id)) return;
        obj.visible = node.visible;
        obj.applyTransformation(node.nodeMatrix);

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            if(!nodeChild) continue;
            const objChild = <SDNode>obj.children.find(oc => (<SDNode>oc).SDid === nodeChild.id);
            this.updateNodeTransformations(nodeChild, objChild);
        }
    }






    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
     public updateData(node: TreeNode, obj: SDNode, data: ITreeNodeData): void {
        let dataChild = <SDData>obj.children.find(oc => (<SDNode>oc).SDid === data.id);

        // return if this data already exists and has the correct version
        if(dataChild && data.version === dataChild.SDversion) return;

        if (!dataChild) {
            dataChild = new SDData(data.id, data.version);
            obj.add(dataChild);
        }

        switch (true) {
            case data instanceof GeometryData:
                const bb = this._renderingEngine.geometryLoader.load(<GeometryData>data, dataChild);
                node.boundingBox.union(bb);
                break;
            case data instanceof ThreejsData:
                dataChild.add(<SDData>(<ThreejsData>data).obj);
                break;
            case data instanceof MaterialData:
                break;
            case data instanceof AbstractLight:
                this._renderingEngine.lightLoader.load(<AbstractLight>data, dataChild, this._scene, this._boundingBox);
                break;
            case data instanceof HTMLElementAnchorData:
                this._renderingEngine.htmlElementAnchorLoader.load(<HTMLElementAnchorData>data);
                break;
            case data instanceof AnimationData:
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    private removeData(dataObject: SDData) {
        dataObject.traverse((o) => {
            if(o instanceof SDData) {
                switch (true) {
                    case o.SDtype === SD_DATA_TYPE.GEOMETRY:
                        // TODO
                        // this._renderingEngine.geometryLoader.removeFromGeometryCache(o.geometry.userData.SDid + '_' + o.geometry.userData.SDversion);
                        // for (const key in o.geometry.attributes) 
                        //     o.geometry.deleteAttribute(key);
                        // o.geometry.setIndex(null);
                        // o.geometry.dispose();
                        break;
                    case o.SDtype === SD_DATA_TYPE.THREEJS:
                        break;
                    case o.SDtype === SD_DATA_TYPE.MATERIAL:
                        // TODO
                        // this._renderingEngine.materialLoader.removeFromMaterialCache(o.material.userData.SDid + '_' + o.material.userData.SDversion);
                        // if ((<THREE.MeshStandardMaterial>o.material).alphaMap) (<THREE.MeshStandardMaterial>o.material).alphaMap?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).aoMap) (<THREE.MeshStandardMaterial>o.material).aoMap?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).bumpMap) (<THREE.MeshStandardMaterial>o.material).bumpMap?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).map) (<THREE.MeshStandardMaterial>o.material).map?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).emissiveMap) (<THREE.MeshStandardMaterial>o.material).emissiveMap?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).metalnessMap) (<THREE.MeshStandardMaterial>o.material).metalnessMap?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).roughnessMap) (<THREE.MeshStandardMaterial>o.material).roughnessMap?.dispose()
                        // if ((<THREE.MeshStandardMaterial>o.material).normalMap) (<THREE.MeshStandardMaterial>o.material).normalMap?.dispose()
                        // if ((<any>o.material).specularMap) (<any>o.material).specularMap?.dispose()
                        // if ((<any>o.material).glossinessMap) (<any>o.material).glossinessMap?.dispose()
                        // o.material.dispose();
                        break;
                    case o.SDtype === SD_DATA_TYPE.LIGHT:
                        break;
                    case o.SDtype === SD_DATA_TYPE.HTML_ELEMENT_ANCHOR:
                        this._renderingEngine.htmlElementAnchorLoader.removeData(o.SDid, o.SDversion);
                        break;
                    case o.SDtype === SD_DATA_TYPE.ANIMATION:
                        break;
                    default:
                        // if there is no valid conversion here, call the convertData of the implementation
                        break;
                }
            }
        })
    }


    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
     private updateNode(node: TreeNode, obj: SDNode) {
        // if this node specifically excludes the current viewer, skip it and all descendants
        if(node.excludeViewers.includes(this._renderingEngine.id)) return;

        // reset the bounding box of the current node
        // it will be recomputed in the following steps
        node.boundingBox = new Box();

        // remove all data items that do not exist anymore
        const dataIds = node.data.map(d => d.id);
        const dataToRemove = obj.children.filter(oc => oc instanceof SDData ? !dataIds.includes(oc.SDid) : false);
        dataToRemove.forEach(dTR => {
            this.removeData(<SDData>dTR)
            obj.remove(dTR);
        })

        // convert all data items of the current node
        // old versions will be replaced by new ones
        for (let i = 0, len = node.data.length; i < len; i++)
            this.updateData(node, obj, node.data[i]);

        // remove all child nodes in the transformed object that do not exist anymore
        // the filter goes also through the data items as they were already added
        const nodeIds = node.children.map(d => d.id);
        const childrenToRemove = obj.children.filter(oc => (oc instanceof SDNode && !(oc instanceof SDData)) ? !nodeIds.includes((<SDNode>oc).SDid) : false);
        childrenToRemove.forEach(cTR => obj.remove(cTR));

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            const objChild = <SDNode>obj.children.find(oc => (<SDNode>oc).SDid === nodeChild.id);

            if (!objChild) {
                // if no child exists, create a new one
                const newChild = new SDNode(nodeChild.id, nodeChild.version);
                obj.add(newChild);
                this.updateNode(nodeChild, newChild);
            } else if (objChild.SDversion !== nodeChild.version) {
                // if the version is different, update the child
                this.updateNode(nodeChild, objChild);
            }

            if(!nodeChild.boundingBox.isEmpty())
                node.boundingBox.union(nodeChild.boundingBox);
        }


        obj.visible = node.visible;
        obj.applyTransformation(node.nodeMatrix);

        if(!node.boundingBox.isEmpty())
            node.boundingBox.applyMatrix(node.nodeMatrix);
    }
    // #endregion Private Methods (1)
}