import * as THREE from 'three'
import { AnimationData, ATTRIBUTEVISUALIZATION, GeometryData, HTMLElementAnchorData, MaterialData, PRIMITIVETYPEHINT, SDTFAttributeVisualization, SDTFAttributeVisualizationData, SDTFItemData, SDTFOverview } from '@shapediver/viewer.shared.types'
import { ISDObject, ITreeNodeData, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Box } from '@shapediver/viewer.shared.math'
import { Converter, EventEngine, EVENTTYPE, InputValidator, Logger, LOGGINGTOPIC, SDError, StateEngine } from '@shapediver/viewer.shared.services'
import { AbstractLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import { mat4, quat, vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { SDNode } from '../types/SDNode'
import { ThreejsData } from '../types/ThreejsData'
import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager'
import { SDData, SD_DATA_TYPE } from '../types/SDData'
import { RENDERERTYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

export class SceneTreeManager implements IManager {
    // #region Properties (10)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _tree: Tree = <Tree>container.resolve(Tree);

    private _boundingBox: Box = new Box();
    private _currentSDTFOverview!: SDTFOverview;
    private _mainNode!: SDNode;

    // #endregion Properties (10)

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

    // #region Public Methods (6)

    public init(): void {}

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
    public updateData(node: TreeNode, obj: SDNode, data: ITreeNodeData): void {
        let dataChild = <SDData>obj.children.find(oc => (<SDData>oc).SDid === data.id && (<SDData>oc).SDversion === data.version);

        if (!dataChild)
            dataChild = new SDData(data.id, data.version);

        obj.add(dataChild);

        if(this._renderingEngine.type === RENDERERTYPE.ATTRIBUTES) {
            const visData = this.injectAttributeData(node, data);
            if(visData.material.opacity === 0) return;
        }

        switch (true) {
            case data instanceof GeometryData:
                dataChild.SDtype = SD_DATA_TYPE.GEOMETRY;
                const bb = this._renderingEngine.geometryLoader.load(<GeometryData>data, dataChild);
                node.boundingBox.union(bb);
                break;
            case data instanceof ThreejsData:
                dataChild.SDtype = SD_DATA_TYPE.THREEJS;
                dataChild.add(<SDData>(<ThreejsData>data).obj);
                break;
            case data instanceof MaterialData:
                dataChild.SDtype = SD_DATA_TYPE.MATERIAL;
                break;
            case data instanceof AbstractLight:
                dataChild.SDtype = SD_DATA_TYPE.LIGHT;
                this._renderingEngine.lightLoader.load(<AbstractLight>data, dataChild, this._scene, this._boundingBox);
                break;
            case data instanceof HTMLElementAnchorData:
                dataChild.SDtype = SD_DATA_TYPE.HTML_ELEMENT_ANCHOR;
                this._renderingEngine.htmlElementAnchorLoader.load(<HTMLElementAnchorData>data);
                break;
            case data instanceof AnimationData:
                dataChild.SDtype = SD_DATA_TYPE.ANIMATION;
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    public updateNode(node: TreeNode, obj: ISDObject) {
        const convertedObject = <SDNode>obj;

        // if this node specifically excludes the current viewer, skip it and all descendants
        if(node.excludeViewers.includes(this._renderingEngine.id)) return;

        // reset the bounding box of the current node
        // it will be recomputed in the following steps
        node.boundingBox = new Box();

        // remove all data items that do not exist anymore
        const dataIds = node.data.map(d => d.id);
        const dataToRemove = convertedObject.children.filter(oc => oc instanceof SDData ? !(dataIds.includes(oc.SDid)) : false);
        dataToRemove.forEach(dTR => {
            this.removeData(<SDData>dTR)
            convertedObject.remove(dTR);
        })

        // remove all child nodes in the transformed object that do not exist anymore
        // the filter goes also through the data items as they were already added
        const nodeIds = node.children.map(d => d.id);
        const childrenToRemove = convertedObject.children.filter(oc => oc instanceof SDNode ? !nodeIds.includes(oc.SDid) : false);
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
            const objChild = <SDNode>convertedObject.children.find(oc => (<SDNode>oc).SDid === nodeChild.id);

            if (!objChild) {
                const newChild = new SDNode(nodeChild.id, nodeChild.version);
                nodeChild.transformedNodes[this._renderingEngine.id] = newChild;
                convertedObject.add(newChild);
                this.updateNode(nodeChild, newChild);
            } else if (objChild.SDversion !== nodeChild.version) {
                // if the version is different, update the child
                this.updateNode(nodeChild, objChild);
                objChild.SDversion = nodeChild.version;
            }

            if(!nodeChild.boundingBox.isEmpty())
                node.boundingBox.union(nodeChild.boundingBox);
        }

        convertedObject.visible = node.visible;
        convertedObject.applyTransformation(node.nodeMatrix);

        if(!node.boundingBox.isEmpty())
            node.boundingBox.applyMatrix(node.nodeMatrix);
    }

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

    public updateSceneTree(root: TreeNode, lightEngine: LightEngine): void {
        const oldBB = this._boundingBox.clone();
        this._boundingBox = new Box();
        this._renderingEngine.lightLoader.shadowMapCount = 0;

        if (!this._mainNode) {
            this._mainNode = new SDNode(root.id, root.version);
            root.transformedNodes[this._renderingEngine.id] = this._mainNode;
            this._scene.add(this._mainNode);
        }

        this._currentSDTFOverview = this._renderingEngine.createSDTFOverview();
        for(let key in this._currentSDTFOverview) {
            if(!this._renderingEngine.visualizationAttributes[key])
                this._renderingEngine.visualizationAttributes[key] = false;
        }

        for(let key in this._renderingEngine.visualizationAttributes) {
            if(!this._currentSDTFOverview[key])
                delete this._renderingEngine.visualizationAttributes[key];
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

    // #endregion Public Methods (6)

    // #region Private Methods (4)

    private collectSDTFItemData(node: TreeNode): SDTFItemData | undefined {
        for (let i = 0, len = node.data.length; i < len; i++)
            if(node.data[i] instanceof SDTFItemData)
                return <SDTFItemData>node.data[i];

        if(!node.parent) return;
        return this.collectSDTFItemData(node.parent);
    }

    private convertSDTFItemToVisualizationData(itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }): SDTFAttributeVisualizationData {
        let material = new MaterialData({ color: '#00fff7', opacity: 1 });
        let matrix = mat4.create();

        if(visualizationAttributes['color']) {
            if(itemData.attributes['color'] && itemData.attributes['color'].typeHint === PRIMITIVETYPEHINT.COLOR){
                const colorAttribute = itemData.attributes['color'];
                const colorColorOverview = overview['color'].filter(o => o.typeHint === PRIMITIVETYPEHINT.COLOR)[0];

                material.color = this._converter.toColor('rgb(' + colorAttribute.value + ')');
            }
        }
        if(visualizationAttributes['plotcolor']){
            if(itemData.attributes['plotcolor'] && itemData.attributes['plotcolor'].typeHint === PRIMITIVETYPEHINT.COLOR){
                const plotcolorAttribute = itemData.attributes['plotcolor'];
                const plotcolorColorOverview = overview['plotcolor'].filter(o => o.typeHint === PRIMITIVETYPEHINT.COLOR)[0];

                material.color = this._converter.toColor('rgb(' + plotcolorAttribute.value + ')');
            }
        }

        if(visualizationAttributes['layer']){
            if(itemData.attributes['layer'] && itemData.attributes['layer'].typeHint === PRIMITIVETYPEHINT.STRING) {
                const layerAttribute = itemData.attributes['layer'];
                const layerStringOverview = overview['layer'].filter(o => o.typeHint === PRIMITIVETYPEHINT.STRING)[0];

                return SDTFAttributeVisualization.stringVisualization(
                    layerAttribute.value, 
                    layerStringOverview.values!, 
                    ATTRIBUTEVISUALIZATION.GRAYSCALE
                );
            }
        }
        return { material, matrix };
    }

    private injectAttributeData(node: TreeNode, data: ITreeNodeData) {
        const itemData = this.collectSDTFItemData(node);       
        let visData = {
            material: new MaterialData({ color: '#00fff7', opacity: 1 }),
            matrix: mat4.create()
        };

        if(itemData) {
            if(this._renderingEngine.convertSDTFItemToVisualizationData) {
                const userVisData = this._renderingEngine.convertSDTFItemToVisualizationData(itemData, this._currentSDTFOverview, this._renderingEngine.visualizationAttributes);
                try {
                    this._inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer.convertSDTFItemToVisualizationData`, userVisData, 'object', true);
                    this._inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer.convertSDTFItemToVisualizationData`, userVisData.matrix, 'mat4', true)
                    visData.material = userVisData.material;
                    visData.matrix = visData.matrix;
                } catch(e) {
                    if(e instanceof SDError)
                        this._logger.warn(LOGGINGTOPIC.VIEWER, e.message);
                    this._logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer.convertSDTFItemToVisualizationData: Encountered an error while parsing the visualization data.`, false); 
                }
            } else {
                visData = this.convertSDTFItemToVisualizationData(itemData, this._currentSDTFOverview, this._renderingEngine.visualizationAttributes);
            }
        }

        node.transformations.push({
            id: 'sdtf',
            matrix: visData.matrix
        })

        if(data instanceof GeometryData)
            data.primitive.attributeMaterial = visData.material;
        
        return visData;
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