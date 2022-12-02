import * as THREE from 'three'
import {
    IMaterialAbstractData,
    IAnimationData,
    IGeometryData,
    IHTMLElementAnchorData,
    IMaterialStandardData,
    SDTFOverviewData,
    SDTFItemData,
    GeometryData,
    AbstractMaterialData,
    HTMLElementAnchorData,
    AnimationData,
    MaterialStandardData,
    ISDTFOverview,
    BoneData
} from '@shapediver/viewer.shared.types'
import { ITree, ITreeNode, ITreeNodeData, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Box, IBox } from '@shapediver/viewer.shared.math'
import {
    Converter,
    EventEngine,
    EVENTTYPE,
    InputValidator,
    Logger,
    LOGGING_TOPIC,
    ShapeDiverBackendError,
    ShapeDiverViewerError,
    StateEngine,
} from '@shapediver/viewer.shared.services'
import { AbstractLight, DirectionalLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import { mat4, quat, vec3 } from 'gl-matrix'
import { container } from 'tsyringe'
import { ISDObject, RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

import { ThreejsData } from '../types/ThreejsData'
import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager'
import { Bone } from 'three'
import { AbstractCamera } from '@shapediver/viewer.rendering-engine.camera-engine'
import { SDData, SD_DATA_TYPE } from '../objects/SDData'
import { SDObject } from '../objects/SDObject'
import { SDBone } from '../objects/SDBone'

export class SceneTreeManager implements IManager {
    // #region Properties (10)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: ITree = <ITree>container.resolve(Tree);

    private _boundingBox: IBox = new Box();
    private _boundingBoxSensitiveData: {
        data: AbstractLight,
        dataChild: SDData
    }[] = [];

    private _currentSDTFOverview!: ISDTFOverview;
    private _mainNode!: SDObject;

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._scene.background = new THREE.Color('#ffffff');
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get boundingBox(): IBox {
        return this._boundingBox;
    }

    public get scene() {
        return this._scene;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (6)

    public init(): void { }

    public isEmpty() {
        return ((this._boundingBox.min[0] === 0 && this._boundingBox.min[1] === 0 && this._boundingBox.min[2] === 0 &&
            this._boundingBox.max[0] === 0 && this._boundingBox.max[1] === 0 && this._boundingBox.max[2] === 0) || this._boundingBox.isEmpty());
    }

    private getBone(node: ITreeNode): SDBone {
        let bone: SDBone;
        this._mainNode.traverse((o) => {
            if ((<SDObject>o).SDid === node.id)
                bone = (<SDBone>o);
        });
        return bone!;
    }

    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
    public updateData(node: ITreeNode, obj: SDObject, data: ITreeNodeData): void {
        let dataChild = <SDData>obj.children.find(oc => (<SDData>oc).SDid === data.id && (<SDData>oc).SDversion === data.version);

        if (!dataChild)
            dataChild = new SDData(data.id, data.version);

        obj.add(dataChild);

        if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES)
            this.injectAttributeData(node, data);

        switch (true) {
            case data instanceof GeometryData:
                dataChild.SDtype = SD_DATA_TYPE.GEOMETRY;
                const geometryData = <IGeometryData>data;

                let skeleton;
                if (geometryData.skinNode) {
                    const bones: THREE.Bone[] = [];
                    for (let i = 0; i < geometryData.skinNode.bones.length; i++)
                        bones.push(this.getBone(geometryData.skinNode.bones[i]));

                    const boneInverses: THREE.Matrix4[] = [];
                    for (let i = 0; i < geometryData.skinNode.boneInverses.length; i++)
                        boneInverses.push(new THREE.Matrix4().fromArray(geometryData.skinNode.boneInverses[i]));

                    skeleton = new THREE.Skeleton(bones, boneInverses)
                }

                const bb = this._renderingEngine.geometryLoader.load(<GeometryData>data, dataChild, skeleton);

                // adjust the general BB
                node.boundingBox.union(bb);

                // create the specific BB if it doesn't exist yet
                if(!node.boundingBoxViewport[this._renderingEngine.id]) 
                    node.boundingBoxViewport[this._renderingEngine.id] = new Box();
                                
                // adjust the specific BB
                node.boundingBoxViewport[this._renderingEngine.id].union(bb);

                break;
            case data instanceof ThreejsData:
                dataChild.SDtype = SD_DATA_TYPE.THREEJS;
                dataChild.add(<SDData>(<ThreejsData>data).obj);

                const bbThree = new THREE.Box3().setFromObject((<ThreejsData>data).obj);

                // adjust the general BB
                node.boundingBox.union(new Box(vec3.fromValues(...bbThree.min.toArray()), vec3.fromValues(...bbThree.max.toArray())));

                // create the specific BB if it doesn't exist yet
                if(!node.boundingBoxViewport[this._renderingEngine.id]) 
                    node.boundingBoxViewport[this._renderingEngine.id] = new Box();
                                
                // adjust the specific BB
                node.boundingBoxViewport[this._renderingEngine.id].union(new Box(vec3.fromValues(...bbThree.min.toArray()), vec3.fromValues(...bbThree.max.toArray())));

                break;
            case data instanceof AbstractMaterialData:
                dataChild.SDtype = SD_DATA_TYPE.MATERIAL;
                break;
            case data instanceof AbstractLight:
                dataChild.SDtype = SD_DATA_TYPE.LIGHT;
                this._renderingEngine.lightLoader.load(<AbstractLight>data, dataChild);
                if (data instanceof DirectionalLight && (<DirectionalLight>data).useNodeData === false)
                    this._boundingBoxSensitiveData.push({ data: <AbstractLight>data, dataChild })
                break;
            case data instanceof AbstractCamera:
                dataChild.SDtype = SD_DATA_TYPE.CAMERA;
                this._renderingEngine.cameraManager.load(<AbstractCamera>data, dataChild);
                break;
            case data instanceof HTMLElementAnchorData:
                dataChild.SDtype = SD_DATA_TYPE.HTML_ELEMENT_ANCHOR;
                this._renderingEngine.htmlElementAnchorLoader.load(node, <HTMLElementAnchorData>data);
                break;
            case data instanceof AnimationData:
                dataChild.SDtype = SD_DATA_TYPE.ANIMATION;
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    public updateNodeTransformations(node: ITreeNode = this._tree.root, obj: SDObject = this._mainNode) {
        if (!node || !obj) return;

        obj.visible = node.visible && !node.excludeViewports.includes(this._renderingEngine.id) && !(node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._renderingEngine.id));
        obj.applyTransformation(node.nodeMatrix);

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            if (!nodeChild) continue;
            const objChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);
            if (objChild) this.updateNodeTransformations(nodeChild, objChild);
        }
    }

    public updateMorphWeights(node: ITreeNode = this._tree.root, obj: SDObject = this._mainNode) {
        if (!node || !obj) return;

        for (let i = 0, len = node.data.length; i < len; i++) {
            if (node.data[i] instanceof GeometryData) {
                const data: GeometryData = <GeometryData>node.data[i];
                let dataChild = <SDData>obj.children.find(oc => (<SDData>oc).SDid === data.id && (<SDData>oc).SDversion === data.version);
                if (dataChild)
                    dataChild.traverse(o => {
                        if (o instanceof THREE.Points ||
                            o instanceof THREE.LineSegments ||
                            o instanceof THREE.LineLoop ||
                            o instanceof THREE.Line ||
                            o instanceof THREE.Mesh)
                            o.morphTargetInfluences = data.morphWeights;
                    })
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
    public updateNode(node: ITreeNode, obj: THREE.Object3D) {
        const convertedObject = <SDObject>obj;

        // reset the general bounding box of the current node
        // it will be recomputed in the following steps
        node.boundingBox.reset();

        // create the specific BB if it doesn't exist yet
        if(!node.boundingBoxViewport[this._renderingEngine.id]) 
            node.boundingBoxViewport[this._renderingEngine.id] = new Box();

        // reset the specific bounding box of the current node
        // it will be recomputed in the following steps
        node.boundingBoxViewport[this._renderingEngine.id].reset();

        // remove all data items that do not exist anymore
        const dataIds = node.data.map(d => d.id);
        const dataToRemove = convertedObject.children.filter(oc => oc instanceof SDData ? !(dataIds.includes(oc.SDid)) : false);
        dataToRemove.forEach(dTR => {
            this.removeData(<SDData>dTR)
            convertedObject.remove(dTR);
        })

        // remove all child nodes in the transformed object that do not exist anymore
        // the filter goes also through the data items as they were already added
        const nodeIds = node.children.filter(d => !d.excludeViewports.includes(this._renderingEngine.id)).map(d => d.id);
        const childrenToRemove = convertedObject.children.filter(oc => oc instanceof SDObject ? !nodeIds.includes(oc.SDid) : false);
        childrenToRemove.forEach(cTR => {
            cTR.traverse((o) => {
                if (o instanceof SDData)
                    this.removeData(o);
            })
            convertedObject.remove(cTR);
        });

        // convert all data items of the current node
        // old versions will be replaced by new ones
        for (let i = 0, len = node.data.length; i < len; i++)
            this.updateData(node, convertedObject, node.data[i]);

        // add new children and update the ones that have a different version
        for (let i = 0, len = node.children.length; i < len; i++) {
            const nodeChild = node.children[i];
            const objChild = <SDObject>convertedObject.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);

            if (!objChild) {
                const newChild = node.data.find(d => d instanceof BoneData) ? new SDBone(nodeChild.id, nodeChild.version) : new SDObject(nodeChild.id, nodeChild.version);
                const oldChild = nodeChild.threeJsObject[this._renderingEngine.id];
                nodeChild.threeJsObject[this._renderingEngine.id] = newChild;
                if(nodeChild.updateCallbackThreeJsObject) 
                    nodeChild.updateCallbackThreeJsObject(newChild, oldChild, this._renderingEngine.id)
                convertedObject.add(newChild);
                this.updateNode(nodeChild, newChild);
            } else if (objChild.SDversion !== nodeChild.version) {
                // if the version is different, update the child
                this.updateNode(nodeChild, objChild);
                objChild.SDversion = nodeChild.version;
            } else {
                this.updateNode(nodeChild, objChild);
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
                if(node.visible && !node.excludeViewports.includes(this._renderingEngine.id) && !(node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._renderingEngine.id))) {
                    node.boundingBoxViewport[this._renderingEngine.id].union(nodeChild.boundingBoxViewport[this._renderingEngine.id]);
                }
            }
        }

        convertedObject.visible = node.visible && !node.excludeViewports.includes(this._renderingEngine.id) && !(node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._renderingEngine.id));
        convertedObject.applyTransformation(node.nodeMatrix);

        // apply matrix to general BB
        if (!node.boundingBox.isEmpty())
            node.boundingBox.applyMatrix(node.nodeMatrix);

        // apply matrix to specific BB
        if (!node.boundingBoxViewport[this._renderingEngine.id].isEmpty())
            node.boundingBoxViewport[this._renderingEngine.id].applyMatrix(node.nodeMatrix);
    }

    public updateSceneTree(root: ITreeNode, lightEngine: LightEngine): void {
        if (this._renderingEngine.closed) return;
        const oldBB = this._boundingBox.clone();
        this._boundingBox = new Box();
        this._renderingEngine.lightLoader.shadowMapCount = 0;

        if (!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            const oldObj = root.threeJsObject[this._renderingEngine.id];
            root.threeJsObject[this._renderingEngine.id] = this._mainNode;
            if(root.updateCallbackThreeJsObject) 
                root.updateCallbackThreeJsObject(this._mainNode, oldObj, this._renderingEngine.id)
            this._scene.add(this._mainNode);
        }

        this._boundingBoxSensitiveData = [];

        this._currentSDTFOverview = this.createSDTFOverview();
        this.updateNode(root, this._mainNode);
        this._boundingBox = root.boundingBoxViewport[this._renderingEngine.id].clone();

        for (let i = 0; i < this._boundingBoxSensitiveData.length; i++)
            this._renderingEngine.lightLoader.adjustToBoundingBox(this._boundingBoxSensitiveData[i].data, this._boundingBoxSensitiveData[i].dataChild, this._boundingBox)

        if (!this._boundingBox.isEmpty())
            this._boundingBox.applyMatrix(root.nodeMatrix);

        if (!(this._boundingBox.min[0] === oldBB.min[0] && this._boundingBox.min[1] === oldBB.min[1] && this._boundingBox.min[2] === oldBB.min[2] &&
            this._boundingBox.max[0] === oldBB.max[0] && this._boundingBox.max[1] === oldBB.max[1] && this._boundingBox.max[2] === oldBB.max[2])) {
            if (!this._stateEngine.renderingEngines[this._renderingEngine.id].boundingBoxCreated.resolved && !this._boundingBox.isEmpty())
                this._stateEngine.renderingEngines[this._renderingEngine.id].boundingBoxCreated.resolve(true);

            this._eventEngine.emitEvent(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, {
                viewportId: this._renderingEngine.id, boundingBox: {
                    min: vec3.clone(this._boundingBox.min),
                    max: vec3.clone(this._boundingBox.max),
                }
            });
        }

        this._renderingEngine.renderingManager.evaluateTextureUnitCount(this._renderingEngine.lightLoader.shadowMapCount + this._renderingEngine.materialLoader.maxMapCount);
    }

    // #endregion Public Methods (6)

    // #region Private Methods (4)

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
                out.merge(<SDTFOverviewData>node.data[i])

        for (let i = 0, len = node.children.length; i < len; i++)
            out.merge(new SDTFOverviewData(this.createSDTFOverview(node.children[i])));

        return out.overview;
    }

    private injectAttributeData(node: ITreeNode, data: ITreeNodeData) {
        const itemData = this.collectSDTFItemData(node);
        let visData: {
            material: IMaterialAbstractData,
            matrix: mat4
        } = {
            material: new MaterialStandardData({ color: '#00fff7', opacity: 1 }),
            matrix: mat4.create()
        };

        if (this._renderingEngine.visualizeAttributes) {
            const userVisData = this._renderingEngine.visualizeAttributes(this._currentSDTFOverview, itemData);
            try {
                this._inputValidator.validateAndError(LOGGING_TOPIC.VIEWPORT, `Viewer.visualizeAttributes`, userVisData, 'object', true);
                this._inputValidator.validateAndError(LOGGING_TOPIC.VIEWPORT, `Viewer.visualizeAttributes`, userVisData.matrix, 'mat4', true)
                visData.material = userVisData.material;
                visData.matrix = visData.matrix;
            } catch (e) {
                if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError)
                    throw e;
                throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `Viewer.visualizeAttributes: Encountered an error while parsing the visualization data.`, e);
            }
        }

        node.addTransformation({
            id: 'sdtf',
            matrix: visData.matrix
        })

        if (data instanceof GeometryData)
            data.primitive.attributeMaterial = visData.material;
    }

    private removeData(dataObject: SDData) {
        switch (true) {
            case dataObject.SDtype === SD_DATA_TYPE.GEOMETRY:
                dataObject.traverse((o) => {
                    if (o instanceof SDData) {
                        if (o instanceof THREE.Mesh) {
                            this._renderingEngine.geometryLoader.removeFromGeometryCache(o.geometry.userData.SDid + '_' + o.geometry.userData.SDversion)
                            this._renderingEngine.materialLoader.removeFromMaterialCache(o.material.userData.SDid + '_' + o.material.userData.SDversion)
                            for (const key in o.geometry.attributes)
                                o.geometry.deleteAttribute(key);
                            o.geometry.setIndex(null);
                            o.geometry.dispose();
                            if ((<THREE.MeshPhysicalMaterial>o.material).alphaMap) (<THREE.MeshPhysicalMaterial>o.material).alphaMap?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).aoMap) (<THREE.MeshPhysicalMaterial>o.material).aoMap?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).bumpMap) (<THREE.MeshPhysicalMaterial>o.material).bumpMap?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).map) (<THREE.MeshPhysicalMaterial>o.material).map?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).emissiveMap) (<THREE.MeshPhysicalMaterial>o.material).emissiveMap?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).metalnessMap) (<THREE.MeshPhysicalMaterial>o.material).metalnessMap?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).roughnessMap) (<THREE.MeshPhysicalMaterial>o.material).roughnessMap?.dispose()
                            if ((<THREE.MeshPhysicalMaterial>o.material).normalMap) (<THREE.MeshPhysicalMaterial>o.material).normalMap?.dispose()
                            if ((<any>o.material).specularMap) (<any>o.material).specularMap?.dispose()
                            if ((<any>o.material).glossinessMap) (<any>o.material).glossinessMap?.dispose()
                            o.material.dispose();
                        }
                    }

                });
                break;
            case dataObject.SDtype === SD_DATA_TYPE.THREEJS:
                break;
            case dataObject.SDtype === SD_DATA_TYPE.MATERIAL:
                break;
            case dataObject.SDtype === SD_DATA_TYPE.LIGHT:
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

    // #endregion Private Methods (4)
}
