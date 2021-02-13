import * as THREE from 'three';

import { SD_RENDERINGTYPE, GeometryData, MaterialData, TEXTURE_WRAPPING, TEXTURE_FILTERING, MapData } from '@shapediver/viewer.shared.types';
import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';

import { PrimitiveLoader } from './PrimitiveLoader';
import { SDObject } from './SDObject';
import { ThreejsData } from './ThreejsData';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';
import { Box } from '@shapediver/viewer.math.box';

export class SceneTree {
    // #region Properties (2)

    private readonly _primitiveLoader: PrimitiveLoader = new PrimitiveLoader();
    private readonly _scene: THREE.Scene = new THREE.Scene();
    private _mainNode!: SDObject;
    protected _geometryCache: {
        [key: string]: SDObject
    } = {};
    // #endregion Properties (2)

    // #region Public Accessors (1)

    public get scene() {
        return this._scene;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    /**
     * Convert the data of the scene graph node into the format of the implementation.
     * 
     * @param data the data element
     * @param obj the corresponding type node
     */
    public convertData(data: ITreeNodeData, obj: SDObject): void {
        let dataChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === data.id && (<SDObject>oc).SDversion === data.version);

        if(!dataChild) 
            dataChild = new SDObject(data.id, data.version);

        obj.add(dataChild);

        switch(true) {
            case data instanceof GeometryData:
                this.createGeometryObject(<GeometryData>data, dataChild);
                break;
            case data instanceof ThreejsData:
                dataChild.add(<SDObject>(<ThreejsData>data).obj);
                break;
            case data instanceof MaterialData:
                // we only store it here to retrieve it for material assignment later on
                // this._helper.addData(this.createMaterial(<SceneGraphMaterialData>data), dataChild);
                break;
            default:
                // if there is no valid conversion here, call the convertData of the implementation
                break;
        }
    }

    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
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
                
            const objNew = new SDObject(geometry.id, geometry.version);
            objNew.add(instancedMesh);
            parent.add(objNew);

            geometry.convertedObjects.push(objNew);

            this._geometryCache[geometry.id+'_'+SD_RENDERINGTYPE.THREEJS] = objNew;
        
        } else {
            const obj = new SDObject(geometry.id, geometry.version);
            obj.add(new THREE.Mesh(this._primitiveLoader.load(geometry.primitive), this.createMaterial(geometry.primitive.material!)));
            this._geometryCache[geometry.id+'_'+SD_RENDERINGTYPE.THREEJS] = obj;
            geometry.convertedObjects.push(obj)
            parent.add(obj);
        }
    }

    private createTexture(map: MapData): THREE.Texture {
        const texture = new THREE.Texture(map.image);
        texture.format = THREE.RGBFormat;
        texture.minFilter = (() => {
            switch(map.minFilter) {
                case TEXTURE_FILTERING.NEAREST:
                    return THREE.NearestFilter;
                case TEXTURE_FILTERING.NEAREST_MIPMAP_NEAREST:
                    return THREE.NearestMipMapNearestFilter;
                case TEXTURE_FILTERING.LINEAR_MIPMAP_NEAREST:
                    return THREE.LinearMipMapNearestFilter;
                case TEXTURE_FILTERING.NEAREST_MIPMAP_LINEAR:
                    return THREE.NearestMipMapLinearFilter;
                case TEXTURE_FILTERING.LINEAR:
                    return THREE.LinearFilter
                case TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR:
                default:
                    return THREE.LinearMipMapLinearFilter;
            }
        })();
        texture.magFilter = (() => {
            switch(map.magFilter) {
                case TEXTURE_FILTERING.NEAREST:
                    return THREE.NearestFilter;
                case TEXTURE_FILTERING.LINEAR:
                default:
                    return THREE.LinearFilter
            }
        })();
        texture.wrapS = (() => {
            switch(map.wrapS) {
                case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
                    return THREE.ClampToEdgeWrapping;
                case TEXTURE_WRAPPING.MIRRORED_REPEAT:
                    return THREE.MirroredRepeatWrapping;
                case TEXTURE_WRAPPING.REPEAT:
                default:
                    return THREE.RepeatWrapping
            }
        })();
        texture.wrapT = (() => {
            switch(map.wrapT) {
                case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
                    return THREE.ClampToEdgeWrapping;
                case TEXTURE_WRAPPING.MIRRORED_REPEAT:
                    return THREE.MirroredRepeatWrapping;
                case TEXTURE_WRAPPING.REPEAT:
                default:
                    return THREE.RepeatWrapping
            }
        })();

        texture.center = new THREE.Vector2(map.center[0], map.center[1]);
        // TODO color
        // texture.color = new THREE.Color(map.color[0], map.color[1], map.color[2]);
        texture.offset = new THREE.Vector2(map.offset[0], map.offset[1]);
        texture.repeat = new THREE.Vector2(map.repeat[0], map.repeat[1]);
        texture.rotation = map.rotation;
        
        texture.flipY = false;
        texture.needsUpdate = true;
        return texture;
    }
  
    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
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

            if(materialProperties.alphaMap !== undefined)
                material.alphaMap = this.createTexture(materialProperties.alphaMap);

            // aoMap

            // aoMapIntensity

            if(materialProperties.bumpMap !== undefined)
                material.bumpMap = this.createTexture(materialProperties.bumpMap);

            material.bumpScale = materialProperties.bumpScale;

            material.color = new THREE.Color(   materialProperties.color[0] > 1 ? materialProperties.color[0]/255 : materialProperties.color[0], 
                                                materialProperties.color[1] > 1 ? materialProperties.color[1]/255 : materialProperties.color[1], 
                                                materialProperties.color[2] > 1 ? materialProperties.color[2]/255 : materialProperties.color[2]);
            //, materialProperties.color[3]);

            // displacementMap

            // displacementScale

            // displacementBias

            material.emissive = new THREE.Color(materialProperties.emissiveness[0], materialProperties.emissiveness[1], materialProperties.emissiveness[2]); 

            if(materialProperties.emissiveMap !== undefined)
                material.emissiveMap = this.createTexture(materialProperties.emissiveMap);

            // emissiveIntensity

            // envMap

            // envMapIntensity

            // lightMap

            // lightMapIntensity

            if(materialProperties.map !== undefined)
                material.map = this.createTexture(materialProperties.map);

            material.metalness = materialProperties.metalness;

            material.roughness = materialProperties.roughness;

            if(materialProperties.metalnessRoughnessMap !== undefined) {
                material.metalnessMap = this.createTexture(materialProperties.metalnessRoughnessMap);
                material.roughnessMap = material.metalnessMap;
            } else {
                if(materialProperties.metalnessMap !== undefined)
                    material.metalnessMap = this.createTexture(materialProperties.metalnessMap);
                if(materialProperties.roughnessMap !== undefined)
                    material.roughnessMap = this.createTexture(materialProperties.roughnessMap);
            }

            // morphNormals

            // morphTargets

            if(materialProperties.normalMap !== undefined)
                material.normalMap = this.createTexture(materialProperties.normalMap);

            // normalMapType

            material.normalScale = new THREE.Vector2(materialProperties.normalScale, materialProperties.normalScale);

            // refractionRatio


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

    private calculateBoundingBox(node: TreeNode): Box {
        let box: Box = new Box();
        for(let i = 0, len = node.data.length; i < len; i++) {
            if(node.data[i] instanceof GeometryData) {
                box.union((node.data[i] as GeometryData).boundingBox);
            }
        }

        for(let i = 0; i < node.getNumberOfChildren(); i++)
            box.union(this.calculateBoundingBox(node.getChildAt(i)))

        return box;
    }

    public updateSceneTree(root: TreeNode): void {
        const box: Box = this.calculateBoundingBox(root);
        console.log(box)

        this._geometryCache = {};
        if(!this._mainNode) {
            this._mainNode = new SDObject(root.id, root.version);
            this._scene.add(this._mainNode);
        }
        this.updateNode(root, this._mainNode);

        const threeBox = new THREE.Box3();
        threeBox.setFromObject(this._mainNode);
        console.log(threeBox)
    }

    
    /**
     * Update the current node via the scene graph node.
     * Convert the data if needed.
     * 
     * @param node the scene graph node
     * @param obj the current type object
     */
    private updateNode(node: TreeNode, obj: SDObject) {
        obj.applyTransformation(node.nodeMatrix);

        for(let i = 0, len = node.data.length; i < len; i++) {
            this.convertData(node.data[i], obj);
        }

        const nodeIds: string[] = []
        for(let i = 0; i < node.getNumberOfChildren(); i++) {
            nodeIds.push(node.getChildAt(i).id)
        }
        const dataIds = node.data.map(d => d.id);
        const dataVersions = node.data.map(d => d.version);
        const childrenToRemove = obj.children.filter(oc => (!nodeIds.includes((<SDObject>oc).SDid)) && !(dataIds.includes((<SDObject>oc).SDid) && dataVersions.includes((<SDObject>oc).SDversion)));
        
        // remove children that are not anymore in there
        for(const objChild of childrenToRemove)
            obj.remove(objChild);

        // add new children and update the ones that have a different version
        for(let i = 0, len = node.getNumberOfChildren(); i < len; i++) {
            const nodeChild = node.getChildAt(i);
            const objChild = <SDObject>obj.children.find(oc => (<SDObject>oc).SDid === nodeChild.id);

            if(!objChild) {
                const newChild = new SDObject(nodeChild.id, nodeChild.version);
                obj.add(newChild);
                this.updateNode(nodeChild, newChild);
            } else if(objChild.SDversion !== nodeChild.version){
                this.updateNode(nodeChild, objChild);
            }
        }
    }

    // #endregion Public Methods (3)
}