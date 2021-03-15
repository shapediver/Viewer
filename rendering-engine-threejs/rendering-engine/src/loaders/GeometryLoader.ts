import * as THREE from 'three';

import { GeometryData, PrimitiveData, SD_RENDERINGTYPE } from '@shapediver/viewer.shared.types';
import { SDObject } from '../types/SDObject';
import { Box } from '@shapediver/viewer.shared.math';
import { MaterialLoader } from './MaterialLoader';

export class GeometryLoader {
    // #region Public Methods (1)
    private _geometryCache: {
        [key: string]: SDObject
    } = {};
    
    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
     public load(geometry: GeometryData, parent: SDObject, boundingBox: Box, materialLoader: MaterialLoader): void {
        boundingBox.union(geometry.boundingBox);
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
            const obj = new SDObject(geometry.id, geometry.version);
            const mesh: THREE.Mesh = new THREE.Mesh(this.loadGeometry(geometry.primitive), materialLoader.load(geometry.primitive.material!));
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            obj.add(mesh);
            this._geometryCache[geometry.id + '_' + SD_RENDERINGTYPE.THREEJS] = obj;
            geometry.convertedObjects.push(obj)
            parent.add(obj);
        }
    }

    public loadGeometry(primitive: PrimitiveData): THREE.BufferGeometry {
        let geometry = new THREE.BufferGeometry();
        for (let attributeId in primitive.attributes) {
            const bufferAttribute = primitive.attributes[attributeId];
            let buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute;

            if(bufferAttribute.hasOffset) {
                buffer = new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(bufferAttribute.array, bufferAttribute.stride!), bufferAttribute.itemSize, bufferAttribute.offset!);
            } else {
                buffer = new THREE.BufferAttribute(bufferAttribute.array, bufferAttribute.itemSize, bufferAttribute.normalized);
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
                geometry.setIndex(new THREE.BufferAttribute( primitive.indices.array, primitive.indices.itemSize ));
        }
        return geometry;
    }

    public emptyGeometryCache() {
        this._geometryCache = {};
    }

    // #endregion Public Methods (1)
}