import * as THREE from 'three';

import { GeometryData, MATERIAL_ALPHA, PrimitiveData, SD_RENDERINGTYPE } from '@shapediver/viewer.shared.types';
import { SDObject } from '../types/SDObject';
import { Box } from '@shapediver/viewer.shared.math';
import { MaterialLoader } from './MaterialLoader';
import { RenderingEngine } from '../RenderingEngine';
import { TreeNode } from '@shapediver/viewer.shared.node-tree';

export class GeometryLoader {
    // #region Public Methods (1)
    private _geometryCache: {
        [key: string]: SDObject
    } = {};

    constructor(private readonly _renderingEngine: RenderingEngine) {}
    
    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
     public load(geometry: GeometryData, parent: SDObject, realObject: TreeNode): Box {
        if (this._geometryCache[geometry.id + '_' + SD_RENDERINGTYPE.THREEJS]) {
            // if already in geo cache

            const obj = <SDObject>this._geometryCache[geometry.id + '_' + SD_RENDERINGTYPE.THREEJS];
            let mesh = (<SDObject>obj).children.pop(); // careful, at some point there might be more

            let instancedMesh: THREE.InstancedMesh;

            parent.updateWorldMatrix(true, true);
            // reverse transform of first parents;
            const initialMatrix = parent.matrixWorld.clone().invert();

            if (mesh instanceof THREE.InstancedMesh) {
                const oldInstancedMesh = <THREE.InstancedMesh>mesh;
                const count = oldInstancedMesh.count + 1;

                instancedMesh = new THREE.InstancedMesh(oldInstancedMesh.geometry, oldInstancedMesh.material, count);
                instancedMesh.castShadow = true;
                instancedMesh.receiveShadow = true;
                instancedMesh.applyMatrix4(initialMatrix)

                // update the matrix to our mesh
                instancedMesh.setMatrixAt(0, parent.matrixWorld.clone());

                for (let i = 0; i < oldInstancedMesh.count; i++) {
                    const matrix = new THREE.Matrix4();
                    oldInstancedMesh.getMatrixAt(i, matrix);
                    instancedMesh.setMatrixAt(i + 1, matrix);
                }
            } else {
                const count = 2;

                instancedMesh = new THREE.InstancedMesh((<THREE.Mesh>mesh).geometry, (<THREE.Mesh>mesh).material, count);
                instancedMesh.castShadow = true;
                instancedMesh.receiveShadow = true;
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

            this._geometryCache[geometry.id + '_' + SD_RENDERINGTYPE.THREEJS] = objNew;

        } else {
            const threeGeometry = this.loadGeometry(geometry.primitive);
            const materialSettings = {
                mode: geometry.primitive.mode,
                useVertexTangents: threeGeometry.attributes.tangent !== undefined,
                useVertexColors: threeGeometry.attributes.color !== undefined,
                useFlatShading: threeGeometry.attributes.normal === undefined,
                useMorphTargets: Object.keys( threeGeometry.morphAttributes ).length > 0,
                useMorphNormals: Object.keys( threeGeometry.morphAttributes ).length > 0 && threeGeometry.morphAttributes.normal !== undefined
            }

            const obj = new SDObject(geometry.id, geometry.version);
            let mesh;
            if(geometry.primitive.mode === 0) { // POINTS
                mesh = new THREE.Points(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
            } else if(geometry.primitive.mode === 1) { // LINES
                mesh = new THREE.LineSegments(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
            } else if(geometry.primitive.mode === 2) { // LINE LOOP
                mesh = new THREE.LineLoop(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
            } else if(geometry.primitive.mode === 3) { // LINE STRIP
                mesh = new THREE.Line(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
            } else if(geometry.primitive.mode === 4 || geometry.primitive.mode === 5 || geometry.primitive.mode === 6) { // TRIANGLES || TRIANGLE_STRIP || TRIANGLE_FAN
                mesh = new THREE.Mesh(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
                mesh.geometry.computeVertexNormals();
                if ( geometry.primitive.mode === 5 ) {
                    // TODO
                    // mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleStripDrawMode );
                } else if ( geometry.primitive.mode === 6 ) {
                    // mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleFanDrawMode );
                }
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            } else {
                throw new Error();
                // TODO error
            }

            if(geometry.primitive.material?.alphaMode === MATERIAL_ALPHA.BLEND) {
                mesh.material.transparent = true;
                mesh.material.depthWrite = false;
            }

            // TODO can be optimized
            mesh.geometry.computeBoundingBox()
            mesh.geometry.computeBoundingSphere()
            obj.add(mesh);

            this._geometryCache[geometry.id + '_' + SD_RENDERINGTYPE.THREEJS] = obj;
            
            geometry.convertedObjects.push(obj)
            parent.add(obj);
        }
        return geometry.boundingBox.clone().applyMatrix(realObject.worldMatrix);
    }

    public loadGeometry(primitive: PrimitiveData): THREE.BufferGeometry {
        let geometry = new THREE.BufferGeometry();
        for (let attributeId in primitive.attributes) {
            const bufferAttribute = primitive.attributes[attributeId];
            let buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute;

            if ( bufferAttribute.byteStride && bufferAttribute.byteStride !== bufferAttribute.itemBytes ) {
                // Integer parameters to IB/IBA are in array elements, not bytes.
                const ib = new THREE.InterleavedBuffer( bufferAttribute.array, bufferAttribute.byteStride / bufferAttribute.elementBytes );
                buffer = new THREE.InterleavedBufferAttribute( ib, bufferAttribute.itemSize, ( bufferAttribute.byteOffset % bufferAttribute.byteStride ) / bufferAttribute.elementBytes, bufferAttribute.normalized );
            } else {
                buffer = new THREE.BufferAttribute( bufferAttribute.array, bufferAttribute.itemSize, bufferAttribute.normalized );
            }

            switch (attributeId) {
                case 'POSITION':
                    geometry.setAttribute('position', buffer);
                    break;

                case 'NORMAL':
                    geometry.setAttribute('normal', buffer);
                    break;

                case 'TEXCOORD_0':
                case 'TEXCOORD0':
                case 'TEXCOORD':
                    geometry.setAttribute('uv', buffer);
                    break;

                case 'TEXCOORD_1':
                    geometry.setAttribute('uv2', buffer);
                    break;

                case 'COLOR_0':
                case 'COLOR0':
                case 'COLOR':
                    geometry.setAttribute('color', buffer);
                    break;

                case 'WEIGHT':
                    geometry.setAttribute('skinWeight', buffer);
                    break;

                case 'JOINT':
                    geometry.setAttribute('skinIndex', buffer);
                    break;

                default:
                    // if (!primitive.material) break;
                    // var material = json.materials[primitive.material];
                    // if (!material.technique) break;
                    // var parameters = json.techniques[material.technique].parameters || {};
                    // for (var attributeName in parameters) {
                    //     if (parameters[attributeName]['semantic'] === attributeId) {
                    //         geometry.setAttribute(attributeName, bufferAttribute);
                    //     }
                    // }
            }

            if (primitive.indices)
                geometry.setIndex(new THREE.BufferAttribute( primitive.indices!.array, primitive.indices!.itemSize ));
        }
        return geometry;
    }

    public emptyGeometryCache() {
        this._geometryCache = {};
    }

    // #endregion Public Methods (1)
}