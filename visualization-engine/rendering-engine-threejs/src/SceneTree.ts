import * as THREE from 'three';

import { SD_RENDERINGTYPE, GeometryData, MaterialData } from '@shapediver/viewer.shared.types';
import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';

import { PrimitiveLoader } from './PrimitiveLoader';
import { SDObject } from './SDObject';
import { SDObjectHelper } from './SDObjectHelper';
import { ThreejsData } from './ThreejsData';
import { AbstractSceneTree } from '@shapediver/viewer.visualization-engine.rendering-engine';
import { StencilFunc } from 'three';

export class SceneTree extends AbstractSceneTree<SDObject> {
    // #region Properties (2)

    private readonly _primitiveLoader: PrimitiveLoader = new PrimitiveLoader();
    private readonly _scene: THREE.Scene;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor() {
        super(new SDObjectHelper());
        this._scene = new THREE.Scene();
        (<SDObjectHelper>this.helper).scene = this.scene;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get scene() {
        return this._scene;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    public convertData(data: ITreeNodeData, obj: SDObject): void {
        console.log('convertData', data)
        let dataChild = this.helper.getChildren(obj).find(oc => (<SDObject>oc).SDid === data.id && (<SDObject>oc).SDversion === data.version);
        console.log('A')

        if(!dataChild) 
            dataChild = this.helper.create(data.id, data.version);
        console.log('B')

        this.helper.add(dataChild, obj);
        console.log('C')

        switch(true) {
            case data instanceof GeometryData:
                console.log('D')
                this.createGeometryObject(<GeometryData>data, dataChild);
                break;
            case data instanceof ThreejsData:
                this.helper.add(<SDObject>(<ThreejsData>data).obj, dataChild);
                break;
            case data instanceof MaterialData:
                // we only store it here to retrieve it for material assignment later on
                // this.helper.addData(this.createMaterial(<SceneGraphMaterialData>data), dataChild);
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                console.log('E')

                break;
        }
    }

    public createGeometryObject(geometry: GeometryData, parent: SDObject): void {
        if(this._geometryCache[geometry.id+'_'+SD_RENDERINGTYPE.THREEJS]) {
            // if already in geo cache

            const obj = <SDObject>this._geometryCache[geometry.id+'_'+SD_RENDERINGTYPE.THREEJS];
            let mesh = (<SDObject>obj).children.pop(); // careful, at some point there might be more

            let instancedMesh: THREE.InstancedMesh;

            parent.updateWorldMatrix(true, true);
            // reverse transform of first parents;
            const initialMatrix = parent.matrixWorld.clone().invert();

            if(mesh instanceof THREE.InstancedMesh) {
                const oldInstancedMesh = <THREE.InstancedMesh>mesh;
                const count = oldInstancedMesh.count + 1;

                instancedMesh = new THREE.InstancedMesh(oldInstancedMesh.geometry, oldInstancedMesh.material, count);
                instancedMesh.applyMatrix4(initialMatrix)

                // update the matrix to our mesh
                instancedMesh.setMatrixAt(0, parent.matrixWorld.clone());

                for(let i = 0; i < oldInstancedMesh.count; i++) {
                    const matrix = new THREE.Matrix4();
                    oldInstancedMesh.getMatrixAt(i, matrix);
                    instancedMesh.setMatrixAt(i+1, matrix);
                }
            } else {
                const count = 2;

                instancedMesh = new THREE.InstancedMesh((<THREE.Mesh>mesh).geometry, (<THREE.Mesh>mesh).material, count);
                instancedMesh.applyMatrix4(initialMatrix)
                
                // update the matrix to our mesh
                instancedMesh.setMatrixAt(0, parent.matrixWorld.clone());

                // update the matrix to the other obj
                obj.updateWorldMatrix(true, true);
                instancedMesh.setMatrixAt(1, obj.matrixWorld.clone());
            }

            instancedMesh.instanceMatrix.needsUpdate = true;
                
            const objNew = this.helper.create(geometry.id, geometry.version);
            objNew.add(instancedMesh);
            this.helper.add(objNew, parent);

            geometry.convertedObjects.push(<any>instancedMesh);

            this._geometryCache[geometry.id+'_'+SD_RENDERINGTYPE.THREEJS] = objNew;
        
        } else {
            console.log(geometry)
            const obj = this.helper.create(geometry.id, geometry.version);
            obj.add(new THREE.Mesh(this._primitiveLoader.load(geometry.primitive), this.createMaterial(geometry.primitive.material!)));
            this._geometryCache[geometry.id+'_'+SD_RENDERINGTYPE.THREEJS] = obj;
            geometry.convertedObjects.push(obj)
            this.helper.add(obj, parent);
        }
    }

    public createMaterial(materialProperties?: MaterialData): THREE.Material {
        if (materialProperties) {
            const material = new THREE.MeshStandardMaterial();

            material.alphaTest = materialProperties.alphaCutoff;

            // blendDst

            // blendDstAlpha

            // blendEquation

            // blendEquationAlpha

            // blending

            // blendSrc

            // blendSrcAlpha

            // clipIntersection

            // clippingPlanes

            // clipShadows

            // colorWrite

            // depthFunc

            // depthWrite

            // stencilWrite

            // stencilWriteMask

            // stencilFunc

            // stencilFail

            // stencilZFail

            // stencilZPass

            // flatShading

            // fog

            // opacity

            // polygonOffset

            // polygonOffsetFactor

            // polygonOffsetUnits

            // precision

            // premultipliedAlpha

            // dithering

            // shadowSide

            // side

            // toneMapped

            // transparent

            // vertexColors

            // visible


            


            if(materialProperties.alphaMap !== undefined) {
                material.alphaMap = new THREE.Texture(materialProperties.alphaMap.image);
                material.alphaMap.format = THREE.RGBFormat;
                material.alphaMap.needsUpdate = true;
            }

            // aoMap

            // aoMapIntensity

            if (materialProperties.bumpMap) {
                material.bumpMap = new THREE.Texture(materialProperties.bumpMap.image);
                material.bumpMap.format = THREE.RGBFormat;
                material.bumpMap.needsUpdate = true;
            } 

            material.bumpScale = materialProperties.bumpScale;
            material.color = new THREE.Color(materialProperties.color[0], materialProperties.color[1], materialProperties.color[2]);
            //, materialProperties.color[3]);

            // displacementMap

            // displacementScale

            // displacementBias

            material.emissive = new THREE.Color(materialProperties.emissiveness[0], materialProperties.emissiveness[1], materialProperties.emissiveness[2]); 

            if (materialProperties.emissiveMap) {
                material.emissiveMap = new THREE.Texture(materialProperties.emissiveMap.image);
                material.emissiveMap.format = THREE.RGBFormat;
                material.emissiveMap.needsUpdate = true;
            } 

            // emissiveIntensity

            // envMap

            // envMapIntensity

            // lightMap

            // lightMapIntensity

            if (materialProperties.map) {
                material.map = new THREE.Texture(materialProperties.map.image);
                material.map.format = THREE.RGBFormat;
                material.map.needsUpdate = true;
            } 

            material.metalness = materialProperties.metalness;

            if (materialProperties.metalnessMap) {
                material.metalnessMap = new THREE.Texture(materialProperties.metalnessMap.image);
                material.metalnessMap.format = THREE.RGBFormat;
                material.metalnessMap.needsUpdate = true;
            } 

            // morphNormals

            // morphTargets

            if (materialProperties.normalMap) {
                material.normalMap = new THREE.Texture(materialProperties.normalMap.image);
                material.normalMap.format = THREE.RGBFormat;
                material.normalMap.needsUpdate = true;
            } 

            // normalMapType

            material.normalScale = new THREE.Vector2(materialProperties.normalScale, materialProperties.normalScale);

            // refractionRatio

            material.roughness = materialProperties.roughness;

            if (materialProperties.roughnessMap) {
                material.roughnessMap = new THREE.Texture(materialProperties.roughnessMap.image);
                material.roughnessMap.format = THREE.RGBFormat;
                material.roughnessMap.needsUpdate = true;
            } 

            // skinning

            // vertexTangents

            // wireframe

            // wireframeLinecap

            // wireframeLinejoin

            // wireframeLinewidth


            material.side = THREE.DoubleSide;
            return material;
        } else {
            const material = new THREE.MeshStandardMaterial();
            material.side = THREE.DoubleSide;
            return material;
        }
    }

    // #endregion Public Methods (3)
}