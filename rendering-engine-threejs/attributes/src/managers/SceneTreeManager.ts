import * as THREE from 'three'
import { GeometryData, HTMLElementAnchorData, MaterialData, PRIMITIVETYPEHINT, SDTFAttributeOverview, SDTFItemData } from '@shapediver/viewer.shared.types'
import { ITreeNodeData, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Box } from '@shapediver/viewer.shared.math'
import { Converter, EventEngine, EVENTTYPE, StateEngine } from '@shapediver/viewer.shared.services'
import { AbstractLight, LightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import { mat4, vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { SDObject } from '../types/SDObject'
import { ThreejsData } from '../types/ThreejsData'
import { RenderingEngine } from '../RenderingEngine'
import { IManager } from '../interfaces/IManager'

export type SDTFAttributeVisualizationData = {
    color: string,
    opacity: number,
    matrix: mat4
}

export class SceneTreeManager implements IManager {
    // #region Properties (5)

    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _converter: Converter = <Converter>container.resolve(Converter);

    private _boundingBox: Box = new Box();
    private _mainNode!: SDObject;
    private _currentSDTFAttributeOverview!: SDTFAttributeOverview;

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

    private collectSDTFItemData(node: TreeNode): SDTFItemData | undefined {
        for (let i = 0, len = node.data.length; i < len; i++)
            if(node.data[i] instanceof SDTFItemData)
                return <SDTFItemData>node.data[i];

        if(!node.parent) return;
        return this.collectSDTFItemData(node.parent);
    }

    private convertSDTFItemToVisualizationData(itemData: SDTFItemData, attributes: SDTFAttributeOverview, visualizationAttributes: { [key: string]: boolean; }): SDTFAttributeVisualizationData {
        let color = '#00fff7';
        let opacity = 1;
        let matrix = mat4.create();

        if(visualizationAttributes['color']) {
            if(itemData.attributes['color'] && itemData.attributes['color'].typeHint === PRIMITIVETYPEHINT.COLOR){
                const colorAttribute = itemData.attributes['color'];
                const colorColorOverview = attributes.overview['color'].filter(o => o.typeHint === PRIMITIVETYPEHINT.COLOR)[0];

                color = this._converter.toColor('rgb(' + colorAttribute.value + ')');
            }
        }
        if(visualizationAttributes['plotcolor']){
            if(itemData.attributes['plotcolor'] && itemData.attributes['plotcolor'].typeHint === PRIMITIVETYPEHINT.COLOR){
                const plotcolorAttribute = itemData.attributes['plotcolor'];
                const plotcolorColorOverview = attributes.overview['plotcolor'].filter(o => o.typeHint === PRIMITIVETYPEHINT.COLOR)[0];

                color = this._converter.toColor('rgb(' + plotcolorAttribute.value + ')');
            }
        }

        if(visualizationAttributes['layer']){
            if(itemData.attributes['layer'] && itemData.attributes['layer'].typeHint === PRIMITIVETYPEHINT.STRING) {
                const layerAttribute = itemData.attributes['layer'];
                const layerStringOverview = attributes.overview['layer'].filter(o => o.typeHint === PRIMITIVETYPEHINT.STRING)[0];

                const fraction = 1.0 / (layerStringOverview.values?.length!+1);
                opacity = fraction * (layerStringOverview.values?.indexOf(layerAttribute.value)! + 1);
            }
        }
        return { color, opacity, matrix };
    }

    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
    public convertData(data: ITreeNodeData, obj: SDObject, node: TreeNode): Box {
        let dataChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === data.id && (<SDObject>oc).SDversion === data.version);

        if (!dataChild)
            dataChild = new SDObject(data.id, data.version);

        obj.add(dataChild);

        const itemData = this.collectSDTFItemData(node);       
        let visData = {
            color: '#00fff7',
            opacity: 1,
            matrix: mat4.create()
        };

        if(itemData) {
            if(this._renderingEngine.convertSDTFItemToVisualizationData) {
                visData = this._renderingEngine.convertSDTFItemToVisualizationData(itemData, this._currentSDTFAttributeOverview, this._renderingEngine.visualizationAttributes);
                // TODO sanitize
            } else {
                visData = this.convertSDTFItemToVisualizationData(itemData, this._currentSDTFAttributeOverview, this._renderingEngine.visualizationAttributes);
            }
        }

        node.transformations.push({
            id: 'sdtf',
            matrix: visData.matrix
        })
        switch (true) {
            case data instanceof GeometryData:
                return this._renderingEngine.geometryLoader.load(<GeometryData>data, dataChild, visData);
            case data instanceof ThreejsData:
                dataChild.add(<SDObject>(<ThreejsData>data).obj);
                break;
            case data instanceof MaterialData:
                break;
            case data instanceof AbstractLight:
                this._renderingEngine.lightLoader.load(<AbstractLight>data, dataChild, this._scene, this._boundingBox);
                break;
            case data instanceof HTMLElementAnchorData:
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
        this._renderingEngine.lightLoader.shadowMapCount = 0;

        if (!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            this._scene.add(this._mainNode);
        }

        this._currentSDTFAttributeOverview = this._renderingEngine.createSDTFAttributeOverview();
        for(let key in this._currentSDTFAttributeOverview.overview) {
            if(!this._renderingEngine.visualizationAttributes[key])
                this._renderingEngine.visualizationAttributes[key] = false;
        }

        for(let key in this._renderingEngine.visualizationAttributes) {
            if(!this._currentSDTFAttributeOverview.overview[key])
                delete this._renderingEngine.visualizationAttributes[key];
        }

        // get all overviews
        this.updateNode(root, this._mainNode);
        this._boundingBox = root.boundingBox.clone();

        const lightScene = lightEngine.lightScene;
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

        if(!this._boundingBox.isEmpty())
            this._boundingBox.applyMatrix(root.nodeMatrixSDTF);

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

    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    private updateNode(node: TreeNode, obj: SDObject) {
        if(node.excludeViewers.includes(this._renderingEngine.id)) return;
        node.boundingBox = new Box();

        for (let i = 0, len = node.data.length; i < len; i++) {
            const bb = this.convertData(node.data[i], obj, node);
            node.boundingBox.union(bb)
        }
        obj.applyTransformation(node.nodeMatrixSDTF);

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

            if(!nodeChild.boundingBox.isEmpty())
                node.boundingBox.union(nodeChild.boundingBox);
        }
        if(!node.boundingBox.isEmpty())
            node.boundingBox.applyMatrix(node.nodeMatrixSDTF);
    }

    // #endregion Private Methods (1)
}