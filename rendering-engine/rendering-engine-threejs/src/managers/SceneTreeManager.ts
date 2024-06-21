import * as THREE from 'three';
import { AbstractCamera } from '@shapediver/viewer.rendering-engine.camera-engine';
import { AbstractLight, DirectionalLight } from '@shapediver/viewer.rendering-engine.light-engine';
import {
    AbstractMaterialData,
    AnimationData,
    BoneData,
    GeometryData,
    HTMLElementAnchorData,
    IMaterialAbstractData,
    ISDTFOverview,
    MaterialStandardData,
    SDTFItemData,
    SDTFOverviewData
} from '@shapediver/viewer.shared.types';
import { Box, IBox } from '@shapediver/viewer.shared.math';
import { IManager, RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine';
import {
    ITree,
    ITreeNode,
    ITreeNodeData,
    Tree
} from '@shapediver/viewer.shared.node-tree';
import { mat4, vec3 } from 'gl-matrix';
import { RenderingEngine } from '../RenderingEngine';
import { SD_DATA_TYPE, SDData } from '../objects/SDData';
import { SDBone } from '../objects/SDBone';
import { SDObject } from '../objects/SDObject';
import { ThreejsData } from '../types/ThreejsData';
/* eslint-disable @typescript-eslint/no-empty-function */
import {
    EventEngine,
    EVENTTYPE,
    InputValidator,
    StateEngine,
} from '@shapediver/viewer.shared.services';

// #region Type aliases (1)

type UpdateFilter = {
    transformationOnly: boolean
}

// #endregion Type aliases (1)

// #region Classes (1)

export class SceneTreeManager implements IManager {
    // #region Properties (12)

    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _inputValidator: InputValidator = InputValidator.instance;
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = StateEngine.instance;
    private readonly _tree: ITree = Tree.instance;

    private _boundingBox: IBox = new Box();
    private _boundingBoxSensitiveData: {
        data: AbstractLight,
        dataChild: SDData
    }[] = [];
    private _currentSDTFOverview!: ISDTFOverview;
    private _hiddenCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    private _lastRendererType: RENDERER_TYPE = RENDERER_TYPE.STANDARD;
    private _lastRootVersion: string = '';
    private _mainNode!: SDObject;

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._scene.background = new THREE.Color('#ffffff');
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get boundingBox(): IBox {
        return this._boundingBox;
    }

    public get lastRendererType(): RENDERER_TYPE {
        return this._lastRendererType;
    }

    public get lastRootVersion(): string {
        return this._lastRootVersion;
    }

    public get scene() {
        return this._scene;
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (6)

    public init(): void { }

    public isEmpty() {
        return ((this._boundingBox.min[0] === 0 && this._boundingBox.min[1] === 0 && this._boundingBox.min[2] === 0 &&
            this._boundingBox.max[0] === 0 && this._boundingBox.max[1] === 0 && this._boundingBox.max[2] === 0) || this._boundingBox.isEmpty());
    }

    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
    public updateData(node: ITreeNode, obj: SDObject, data: ITreeNodeData, filter: UpdateFilter, isVisibleInHierarchy: boolean, skeleton?: THREE.Skeleton): void {
        let dataChild = <SDData>obj.children.find(oc => (<SDData>oc).SDid === data.id && (<SDData>oc).SDversion === data.version);
        let newChild = false;

        if (!dataChild) {
            newChild = true;
            dataChild = new SDData(data.id, data.version);
            obj.add(dataChild);
        }

        if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES)
            this.injectAttributeData(node, data);

        switch (true) {
            case data instanceof GeometryData:
                {
                    dataChild.SDtype = SD_DATA_TYPE.GEOMETRY;

                    if (filter.transformationOnly === false)
                        this._renderingEngine.geometryLoader.load(<GeometryData>data, dataChild, newChild, skeleton).clone();

                    let bb: IBox = new Box();
                    if (skeleton) {
                        bb = (<GeometryData>data).primitive.computeBoundingBox(node.worldMatrix);
                    } else {
                        const clone = dataChild.clone();
                        clone.applyTransformation(node.worldMatrix);
                        const threeBox = new THREE.Box3().setFromObject(clone, true);
                        bb = new Box(vec3.fromValues(threeBox.min.x, threeBox.min.y, threeBox.min.z), vec3.fromValues(threeBox.max.x, threeBox.max.y, threeBox.max.z));
                    }

                    // adjust the general BB
                    node.boundingBox.union(bb);

                    // create the specific BB if it doesn't exist yet
                    if (!node.boundingBoxViewport[this._renderingEngine.id])
                        node.boundingBoxViewport[this._renderingEngine.id] = new Box();

                    // adjust the specific BB
                    node.boundingBoxViewport[this._renderingEngine.id].union(bb);
                }
                break;
            case data instanceof ThreejsData:
                {
                    dataChild.SDtype = SD_DATA_TYPE.THREEJS;
                    dataChild.add(<SDData>(<ThreejsData>data).obj);

                    const bbThree = new THREE.Box3().setFromObject((<ThreejsData>data).obj);

                    // adjust the general BB
                    node.boundingBox.union(new Box(vec3.fromValues(...bbThree.min.toArray()), vec3.fromValues(...bbThree.max.toArray())));

                    // create the specific BB if it doesn't exist yet
                    if (!node.boundingBoxViewport[this._renderingEngine.id])
                        node.boundingBoxViewport[this._renderingEngine.id] = new Box();

                    // adjust the specific BB
                    node.boundingBoxViewport[this._renderingEngine.id].union(new Box(vec3.fromValues(...bbThree.min.toArray()), vec3.fromValues(...bbThree.max.toArray())));
                }
                break;
            case data instanceof AbstractMaterialData:
                dataChild.SDtype = SD_DATA_TYPE.MATERIAL;
                break;
            case data instanceof AbstractLight:
                dataChild.SDtype = SD_DATA_TYPE.LIGHT;
                if (filter.transformationOnly === false) this._renderingEngine.lightLoader.load(<AbstractLight>data, dataChild);
                if (data instanceof DirectionalLight && (<DirectionalLight>data).useNodeData === false)
                    this._boundingBoxSensitiveData.push({ data: <AbstractLight>data, dataChild });
                break;
            case data instanceof AbstractCamera:
                dataChild.SDtype = SD_DATA_TYPE.CAMERA;
                if (filter.transformationOnly === false) this._renderingEngine.cameraManager.load(<AbstractCamera>data, dataChild);
                break;
            case data instanceof HTMLElementAnchorData:
                dataChild.SDtype = SD_DATA_TYPE.HTML_ELEMENT_ANCHOR;
                if (filter.transformationOnly === false) this._renderingEngine.htmlElementAnchorLoader.load(node, <HTMLElementAnchorData>data, isVisibleInHierarchy);
                break;
            case data instanceof AnimationData:
                dataChild.SDtype = SD_DATA_TYPE.ANIMATION;
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    public updateMorphWeights(node: ITreeNode = this._tree.root, obj: SDObject = this._mainNode) {
        if (!node || !obj) return;

        for (let i = 0, len = node.data.length; i < len; i++) {
            if (node.data[i] instanceof GeometryData) {
                const data: GeometryData = <GeometryData>node.data[i];
                const dataChild = <SDData>obj.children.find(oc => (<SDData>oc).SDid === data.id && (<SDData>oc).SDversion === data.version);
                if (dataChild)
                    dataChild.traverse(o => {
                        if (o instanceof THREE.Points ||
                            o instanceof THREE.LineSegments ||
                            o instanceof THREE.LineLoop ||
                            o instanceof THREE.Line ||
                            o instanceof THREE.Mesh)
                            o.morphTargetInfluences = data.morphWeights;
                    });
            }
        }

        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            if (!nodeChild) continue;
            const objChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);
            if (objChild) this.updateMorphWeights(nodeChild, objChild);
        }
    }

    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    public updateNode(node: ITreeNode = this._tree.root, obj: THREE.Object3D = this._mainNode, filter: UpdateFilter = { transformationOnly: false }, visibleInHierarchy: boolean = true, skeleton?: THREE.Skeleton) {
        const convertedObject = <SDObject>obj;

        // reset the general bounding box of the current node
        // it will be recomputed in the following steps
        node.boundingBox.reset();

        // create the specific BB if it doesn't exist yet
        if (!node.boundingBoxViewport[this._renderingEngine.id])
            node.boundingBoxViewport[this._renderingEngine.id] = new Box();

        // reset the specific bounding box of the current node
        // it will be recomputed in the following steps
        node.boundingBoxViewport[this._renderingEngine.id].reset();

        if (filter.transformationOnly === false) {
            // remove all data items that do not exist anymore
            const dataIds = node.data.map(d => d.id);
            const dataToRemove = convertedObject.children.filter(oc => {
                if (oc instanceof SDData) {
                    if (dataIds.includes(oc.SDid)) {
                        const data = node.data.find(d => d.id === oc.SDid);
                        if (data && data.version !== oc.SDversion) {
                            // version is different
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        // id not included anymore
                        return true;
                    }
                } else {
                    return false;
                }
            });

            dataToRemove.forEach(dTR => {
                this.removeData(<SDData>dTR);
                convertedObject.remove(dTR);
            });

            // remove all child nodes in the transformed object that do not exist anymore
            // the filter goes also through the data items as they were already added
            const nodeIds = node.children.filter(d => !d.excludeViewports.includes(this._renderingEngine.id)).map(d => d.id);
            const childrenToRemove = convertedObject.children.filter(oc => {
                if (oc instanceof SDObject && !(oc instanceof SDData)) {
                    if (nodeIds.includes(oc.SDid)) {
                        const child = node.children.find(d => d.id === oc.SDid);
                        if (child && child.version !== oc.SDversion) {
                            // version is different
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        // id not included anymore
                        return true;
                    }
                } else {
                    return false;
                }
            });
            childrenToRemove.forEach(cTR => {
                cTR.traverse(o => {
                    if (o instanceof SDData)
                        this.removeData(o);
                });
                convertedObject.remove(cTR);
            });
        }

        // create the skeleton if the node is marked as the skin node (root node of the skeleton)
        if (node.skinNode === true) {
            const bones: THREE.Bone[] = [];
            for (let i = 0; i < node.bones.length; i++)
                bones.push(this.getBone(node.bones[i]));

            const boneInverses: THREE.Matrix4[] = [];
            for (let i = 0; i < node.boneInverses.length; i++)
                boneInverses.push(new THREE.Matrix4().fromArray(node.boneInverses[i]));

            skeleton = new THREE.Skeleton(bones, boneInverses);
        }

        const isVisible = node.visible && !node.excludeViewports.includes(this._renderingEngine.id) && !(node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._renderingEngine.id));
        const isVisibleInHierarchy = visibleInHierarchy && isVisible;

        // convert all data items of the current node
        // old versions will be replaced by new ones
        for (let i = 0, len = node.data.length; i < len; i++)
            this.updateData(node, convertedObject, node.data[i], filter, isVisibleInHierarchy, skeleton);

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            const objChild = <SDObject>convertedObject.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);

            if (!objChild) {
                const newChild = node.data.find(d => d instanceof BoneData) ? new SDBone(nodeChild.id, nodeChild.version) : new SDObject(nodeChild.id, nodeChild.version);
                const oldChild = nodeChild.convertedObject[this._renderingEngine.id] as THREE.Object3D;
                nodeChild.convertedObject[this._renderingEngine.id] = newChild;
                if (nodeChild.updateCallbackConvertedObject)
                    nodeChild.updateCallbackConvertedObject(newChild, oldChild, this._renderingEngine.id);
                convertedObject.add(newChild);
                this.updateNode(nodeChild, newChild, filter, isVisibleInHierarchy, skeleton);
            } else if (objChild.SDversion !== nodeChild.version) {
                // if the version is different, update the child
                this.updateNode(nodeChild, objChild, filter, isVisibleInHierarchy, skeleton);
                objChild.SDversion = nodeChild.version;
            } else {
                this.updateNode(nodeChild, objChild, filter, isVisibleInHierarchy, skeleton);
            }

            // adjust the general BB
            if (!nodeChild.boundingBox.isEmpty())
                node.boundingBox.union(nodeChild.boundingBox);

            // adjust the specific BB
            if (nodeChild.boundingBoxViewport[this._renderingEngine.id] && !nodeChild.boundingBoxViewport[this._renderingEngine.id].isEmpty()) {
                // only do this if the node is
                // 1. visible
                // 2. no included in the "excludeViewports"
                // 3. if there are "restrictViewports", it needs to be in them
                if (isVisible)
                    node.boundingBoxViewport[this._renderingEngine.id].union(nodeChild.boundingBoxViewport[this._renderingEngine.id]);
            }
        }

        convertedObject.visible = node.visible && !node.excludeViewports.includes(this._renderingEngine.id) && !(node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._renderingEngine.id));
        convertedObject.applyTransformation(node.nodeMatrix);
    }

    public updateSceneTree(root: ITreeNode): void {
        if (this._tree.root.version === this._lastRootVersion && this._renderingEngine.type === RENDERER_TYPE.STANDARD) return;
        this._lastRootVersion = this._tree.root.version;
        this._lastRendererType = this._renderingEngine.type;

        if (this._renderingEngine.closed) return;
        const oldBB = this._boundingBox.clone();
        this._boundingBox = new Box();
        this._renderingEngine.lightLoader.shadowMapCount = 0;

        if (!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            const oldObj = root.convertedObject[this._renderingEngine.id] as THREE.Object3D;
            root.convertedObject[this._renderingEngine.id] = this._mainNode;
            if (root.updateCallbackConvertedObject)
                root.updateCallbackConvertedObject!(this._mainNode, oldObj, this._renderingEngine.id);
            this._scene.add(this._mainNode);
        }

        this._boundingBoxSensitiveData = [];

        this._currentSDTFOverview = this.createSDTFOverview();
        this.updateNode(root, this._mainNode);
        this._boundingBox = root.boundingBoxViewport[this._renderingEngine.id].clone();

        for (let i = 0; i < this._boundingBoxSensitiveData.length; i++)
            this._renderingEngine.lightLoader.adjustToBoundingBox(this._boundingBoxSensitiveData[i].data, this._boundingBoxSensitiveData[i].dataChild, this._boundingBox);

        if (!(this._boundingBox.min[0] === oldBB.min[0] && this._boundingBox.min[1] === oldBB.min[1] && this._boundingBox.min[2] === oldBB.min[2] &&
            this._boundingBox.max[0] === oldBB.max[0] && this._boundingBox.max[1] === oldBB.max[1] && this._boundingBox.max[2] === oldBB.max[2])) {
            if (!this._stateEngine.viewportEngines[this._renderingEngine.id]?.boundingBoxCreated.resolved && !this._boundingBox.isEmpty())
                this._stateEngine.viewportEngines[this._renderingEngine.id]?.boundingBoxCreated.resolve(true);

            this._eventEngine.emitEvent(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, {
                viewportId: this._renderingEngine.id, boundingBox: {
                    min: vec3.clone(this._boundingBox.min),
                    max: vec3.clone(this._boundingBox.max),
                }
            });
        }

        if (this._boundingBox.isEmpty()) {
            // check if all outputs that should be loaded at the start of a session are loaded
            // if the bounding box is empty then, emit the event
            if (Object.values(this._stateEngine.sessionEngines).every(s => s && s.initialOutputsLoaded.resolved === true)) {
                this._eventEngine.emitEvent(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_EMPTY, {
                    viewportId: this._renderingEngine.id
                });
            }
        }

        this._renderingEngine.renderingManager.evaluateTextureUnitCount(this._renderingEngine.lightLoader.shadowMapCount + this._renderingEngine.materialLoader.maxMapCount);

        /**
         * 
         * Three.js texture upload and compiling
         * This step is needed as three.js would compile the shaders and initialize the texture on the first render call instead.
         * 
         */

        // we initialize all texture and then clear the cache
        const threeJsTextureCache = this._renderingEngine.materialLoader.threeJsTextureCache;
        for (const key in threeJsTextureCache) {
            if (threeJsTextureCache[key].usage === 0) {
                threeJsTextureCache[key].texture.dispose();
                delete threeJsTextureCache[key];
            } else if (threeJsTextureCache[key].initialized === false) {
                this._renderingEngine.renderer.initTexture(threeJsTextureCache[key].texture);
                threeJsTextureCache[key].initialized = true;
            }
        }

        // we compile the shaders
        this._renderingEngine.renderer.compile(this._renderingEngine.scene, this._hiddenCamera);
    }

    // #endregion Public Methods (6)

    // #region Private Methods (5)

    private collectSDTFItemData(node: ITreeNode): SDTFItemData | undefined {
        for (let i = 0, len = node.data.length; i < len; i++)
            if (node.data[i] instanceof SDTFItemData)
                return <SDTFItemData>node.data[i];

        if (!node.parent) return;
        return this.collectSDTFItemData(node.parent);
    }

    private createSDTFOverview(node: ITreeNode = this._tree.root): ISDTFOverview {
        const out: SDTFOverviewData = new SDTFOverviewData({});
        for (let i = 0, len = node.data.length; i < len; i++)
            if (node.data[i] instanceof SDTFOverviewData)
                out.merge(<SDTFOverviewData>node.data[i]);

        for (let i = 0, len = node.children.length; i < len; i++)
            out.merge(new SDTFOverviewData(this.createSDTFOverview(node.children[i])));

        return out.overview;
    }

    private getBone(node: ITreeNode): SDBone {
        let bone: SDBone;
        this._mainNode.traverse((o) => {
            if ((<SDObject>o).SDid === node.id)
                bone = (<SDBone>o);
        });
        return bone!;
    }

    private injectAttributeData(node: ITreeNode, data: ITreeNodeData) {
        const itemData = this.collectSDTFItemData(node);
        const visData: {
            material: IMaterialAbstractData,
            matrix: mat4
        } = {
            material: new MaterialStandardData({ color: this._renderingEngine.defaultMaterialColor, opacity: 1 }),
            matrix: mat4.create()
        };

        if (this._renderingEngine.visualizeAttributes) {
            const userVisData = this._renderingEngine.visualizeAttributes(this._currentSDTFOverview, itemData);
            this._inputValidator.validateAndError('Viewer.visualizeAttributes', userVisData, 'object', true);
            this._inputValidator.validateAndError('Viewer.visualizeAttributes', userVisData.matrix, 'mat4', true);
            visData.material = userVisData.material;
            visData.matrix = userVisData.matrix;
        }

        node.addTransformation({
            id: 'sdtf',
            matrix: visData.matrix
        });

        if (data instanceof GeometryData)
            data.attributeMaterial = visData.material;
    }

    private removeData(dataObject: SDData) {
        if (dataObject.userData.removed === true) return;
        dataObject.userData.removed = true;

        switch (true) {
            case dataObject.SDtype === SD_DATA_TYPE.GEOMETRY:
                dataObject.traverse((o) => {
                    if (dataObject.id !== o.id && o.userData.removed === true) return;
                    o.userData.removed = true;

                    if (o instanceof THREE.Mesh) {
                        this.scene.remove(o);
                        this._renderingEngine.geometryLoader.removeFromGeometryCache(o.geometry.userData.SDid + '_' + o.geometry.userData.SDversion);
                        this._renderingEngine.geometryLoader.removeFromPrimitiveCache(o.geometry.userData.primitiveSDid + '_' + o.geometry.userData.primitiveSDversion);
                        this._renderingEngine.materialLoader.removeFromMaterialCache(o.material.userData.SDid + '_' + o.material.userData.SDversion);

                        const texturesToRemove: THREE.Texture[] = [];
                        for (const t in o.material) {
                            if (o.material[t] instanceof THREE.Texture) {
                                o.material[t].name = t;
                                if (t !== 'envMap') {
                                    if (!texturesToRemove.includes(o.material[t]))
                                        texturesToRemove.push(o.material[t]);
                                }
                            }
                        }

                        for (const texture of texturesToRemove) {
                            if (texture.userData.cacheKey) {
                                this._renderingEngine.materialLoader.threeJsTextureCache[texture.userData.cacheKey].usage--;
                            } else {
                                if (texture.name === 'sphericalNormalMap') {
                                    this._renderingEngine.geometryLoader.removeFromGemSphericalMapsCache(o.geometry.userData.primitiveSDid + '_' + o.geometry.userData.primitiveSDversion);
                                    texture.dispose();
                                } else {
                                    texture.dispose();
                                }
                            }
                        }
                    }
                });
                break;
            case dataObject.SDtype === SD_DATA_TYPE.THREEJS:
                break;
            case dataObject.SDtype === SD_DATA_TYPE.MATERIAL:
                break;
            case dataObject.SDtype === SD_DATA_TYPE.LIGHT:
                dataObject.traverse((o) => {
                    if (o instanceof THREE.Light)
                        o.dispose();
                });
                break;
            case dataObject.SDtype === SD_DATA_TYPE.HTML_ELEMENT_ANCHOR:
                this._renderingEngine.htmlElementAnchorLoader.removeData(dataObject.SDid, dataObject.SDversion);
                break;
            case dataObject.SDtype === SD_DATA_TYPE.ANIMATION:
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    // #endregion Private Methods (5)
}

// #endregion Classes (1)
