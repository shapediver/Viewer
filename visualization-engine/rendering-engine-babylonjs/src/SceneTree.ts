import * as BABYLON from 'babylonjs';
import * as BABYLON_MATERIALS from 'babylonjs-materials';

import { SD_RENDERINGTYPE, GeometryData, MaterialData } from '@shapediver/viewer.shared.types';
import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';

import { PrimitiveLoader } from './PrimitiveLoader';
import { SDObject } from './SDObject';
import { SDObjectHelper } from './SDObjectHelper';
import { BabylonjsData } from './BabylonjsData';
import { AbstractSceneTree } from '@shapediver/viewer.visualization-engine.rendering-engine';

export class SceneTree extends AbstractSceneTree<SDObject> {
    // #region Properties (2)

    private readonly _primitiveLoader: PrimitiveLoader = new PrimitiveLoader();
    private readonly _scene: BABYLON.Scene;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(engine: BABYLON.Engine) {
        super(new SDObjectHelper())
        this._scene = new BABYLON.Scene(engine);    
        this._scene.preventDefaultOnPointerDown = false;
        (<SDObjectHelper>this.helper).scene = this.scene;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get scene() {
        return this._scene;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (2)

    public createGeometryObject(geometry: GeometryData, parent: SDObject): SDObject {
        const obj = this.helper.create(geometry.id, geometry.version)

        // const customMesh = new BABYLON.Mesh("custom", this.scene);
        // this._primitiveLoader.load(geometry.primitive).applyToMesh(customMesh);
        // customMesh.material = new BABYLON_MATERIALS.SimpleMaterial("simpleMaterial", this.scene);
        // customMesh.material.backFaceCulling = false;
        // obj.addChild(customMesh);
        
        // geometry.convertedObjects.push(obj)
        return obj;
    }

    public createMaterial(material?: MaterialData): BABYLON.Material {
        return new BABYLON_MATERIALS.SimpleMaterial("simpleMaterial", this.scene);
    }

    public convertData(data: ITreeNodeData, obj: SDObject): void {    
        // let dataChild = this.helper.getChildren(obj).find(oc => (<SDObject>oc).SDid === data.id && (<SDObject>oc).SDversion === data.version);

        // if(!dataChild) 
        //     dataChild = this.helper.create(data.id, data.version);

        // switch(true) {
        //     case data instanceof GeometryData:
        //         this.helper.add(this.createGeometryObject(<GeometryData>data, dataChild), dataChild);
        //         break;
        //     case data instanceof MaterialData:
        //         // we only store it here to retrieve it for material assignment later on
        //         this.helper.addData(this.createMaterial(<MaterialData><unknown>data), dataChild);
        //         break;
        //     case data instanceof BabylonjsData:
        //         dataChild.addChild((<BabylonjsData>data).obj);
        //         break;
        //     default:
        //         // if there is no valid conversion here, call the convertData of the implementation
        //         break;
        // }
        // this.helper.add(dataChild, obj);
    }

    // #endregion Public Methods (2)
}