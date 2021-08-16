import * as THREE from 'three'
import {
  GeometryData,
  MATERIAL_ALPHA,
  PRIMITIVE_MODE,
  PrimitiveData,
  SD_RENDERINGTYPE,
} from '@shapediver/viewer.shared.types'
import { Box } from '@shapediver/viewer.shared.math'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'

import { SDObject } from '../types/SDObject'
import { MaterialLoader } from './MaterialLoader'
import { RenderingEngine } from '../RenderingEngine'
import { RenderingManager } from '../managers/RenderingManager'
import { ILoader } from '../interfaces/ILoader'

export class GeometryLoader implements ILoader {
    // #region Properties (2)

    private _geometryCache: {
        [key: string]: SDObject
    } = {};
    private _logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (4)

    public emptyGeometryCache() {
        this._geometryCache = {};
    }

    public removeFromGeometryCache(id: string) {
        if(this._geometryCache[id])
            delete this._geometryCache[id];
    }

    public init(): void {}

    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
    public load(geometry: GeometryData, parent: SDObject, realObject: TreeNode): Box {            
        const threeGeometry = this.loadGeometry(geometry.primitive);
        const materialSettings = {
            mode: geometry.primitive.mode,
            useVertexTangents: threeGeometry.attributes.tangent !== undefined,
            useVertexColors: threeGeometry.attributes.color !== undefined,
            useFlatShading: threeGeometry.attributes.normal === undefined,
            useMorphTargets: Object.keys(threeGeometry.morphAttributes).length > 0,
            useMorphNormals: Object.keys(threeGeometry.morphAttributes).length > 0 && threeGeometry.morphAttributes.normal !== undefined
        }

        const obj = new SDObject(geometry.id, geometry.version);
        let mesh;
        if (geometry.primitive.mode === PRIMITIVE_MODE.POINTS) {
            mesh = new THREE.Points(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINES) {
            mesh = new THREE.LineSegments(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINE_LOOP) {
            mesh = new THREE.LineLoop(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINE_STRIP) {
            mesh = new THREE.Line(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLES || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_STRIP || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_FAN) {
            mesh = new THREE.Mesh(this.loadGeometry(geometry.primitive), this._renderingEngine.materialLoader.load(geometry.primitive.material!, materialSettings));
            if (geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_STRIP || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_FAN)
                mesh.geometry = this.convertToTriangleMode(mesh.geometry, geometry.primitive.mode);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        } else {
            throw new SDError(`GeometryLoader.load: Unrecognized primitive mode ${geometry.primitive.mode}.`);
        }

        if (geometry.primitive.material?.alphaMode === MATERIAL_ALPHA.BLEND) {
            mesh.material.transparent = true;
            mesh.material.depthWrite = false;
        }

        // https://shapediver.atlassian.net/browse/SS-3177
        mesh.geometry.computeBoundingBox()
        mesh.geometry.computeBoundingSphere()
        obj.add(mesh);
        mesh.geometry.userData = {
            SDid: geometry.id,
            SDversion: geometry.version
        }
        this._geometryCache[geometry.id + '_' + geometry.version] = obj;

        parent.add(obj);
        return geometry.boundingBox.clone().applyMatrix(geometry.matrix);
    }

    public loadGeometry(primitive: PrimitiveData): THREE.BufferGeometry {
        let geometry = new THREE.BufferGeometry();
        for (let attributeId in primitive.attributes) {
            const bufferAttribute = primitive.attributes[attributeId];
            let buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute;

            if (bufferAttribute.byteStride && bufferAttribute.byteStride !== bufferAttribute.itemBytes) {
                // Integer parameters to IB/IBA are in array elements, not bytes.
                const ib = new THREE.InterleavedBuffer(bufferAttribute.array, bufferAttribute.byteStride / bufferAttribute.elementBytes);
                buffer = new THREE.InterleavedBufferAttribute(ib, bufferAttribute.itemSize, (bufferAttribute.byteOffset % bufferAttribute.byteStride) / bufferAttribute.elementBytes, bufferAttribute.normalized);
            } else {
                buffer = new THREE.BufferAttribute(bufferAttribute.array, bufferAttribute.itemSize, bufferAttribute.normalized);
            }

            if (bufferAttribute.sparse) {
                if (bufferAttribute.array !== null) {
                    // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
                    buffer = new THREE.BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
                }

                for (let i = 0, il = bufferAttribute.sparseIndices!.length; i < il; i++) {
                    const index = bufferAttribute.sparseIndices![i];
                    buffer.setX(index, bufferAttribute.sparseValues![i * bufferAttribute.itemSize]);
                    if (bufferAttribute.itemSize >= 2) buffer.setY(index, bufferAttribute.sparseValues![i * bufferAttribute.itemSize + 1]);
                    if (bufferAttribute.itemSize >= 3) buffer.setZ(index, bufferAttribute.sparseValues![i * bufferAttribute.itemSize + 2]);
                    if (bufferAttribute.itemSize >= 4) buffer.setW(index, bufferAttribute.sparseValues![i * bufferAttribute.itemSize + 3]);
                    if (bufferAttribute.itemSize >= 5) throw new SDError('GeometryLoader.loadGeometry: Unsupported itemSize in sparse BufferAttribute.');
                }
            }

            if(attributeId === 'NORMAL') {
                let blnNormalsOk = false;
                for (let index = 0; index < 10; ++index) {
                  if (Math.abs(bufferAttribute.array[index * 3]) > 0.001) {
                    blnNormalsOk = true;
                    break;
                  }
                  if (
                    Math.abs(bufferAttribute.array[index * 3 + 1]) > 0.001
                  ) {
                    blnNormalsOk = true;
                    break;
                  }
                  if (
                    Math.abs(bufferAttribute.array[index * 3 + 2]) > 0.001
                  ) {
                    blnNormalsOk = true;
                    break;
                  }
                }
                if (!blnNormalsOk) {
                    geometry.computeVertexNormals();
                    continue;
                }
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
                case 'UV':
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
                case 'TANGENT':
                    geometry.setAttribute('tangent', buffer);
                    break;
                default:
                    this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, `GeometryLoader.loadGeometry: Unrecognized attribute id ${attributeId}.`);
            }

            if (primitive.indices)
                geometry.setIndex(new THREE.BufferAttribute(primitive.indices!.array, primitive.indices!.itemSize));
        }
        return geometry;
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    private convertToTriangleMode(geometry: THREE.BufferGeometry, drawMode: PRIMITIVE_MODE) {
        let index = geometry.getIndex();
        // generate index if not present
        if (index === null) {
            const indices = [];
            const position = geometry.getAttribute('position');
            if (position !== undefined) {
                for (let i = 0; i < position.count; i++)
                    indices.push(i);
                geometry.setIndex(indices);
                index = geometry.getIndex();
            } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryLoader.convertToTriangleMode: Undefined position attribute. Processing not possible.'));
                return geometry;
            }
        }

        if (index === null) {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryLoader.convertToTriangleMode: Undefined index. Processing not possible.'));
            return geometry;
        }
        const numberOfTriangles = index.count - 2;
        const newIndices = [];
        if (drawMode === PRIMITIVE_MODE.TRIANGLE_FAN) {
            for (let i = 1; i <= numberOfTriangles; i++) {
                newIndices.push(index.getX(0));
                newIndices.push(index.getX(i));
                newIndices.push(index.getX(i + 1));
            }
        } else {
            for (let i = 0; i < numberOfTriangles; i++) {
                if (i % 2 === 0) {
                    newIndices.push(index.getX(i));
                    newIndices.push(index.getX(i + 1));
                    newIndices.push(index.getX(i + 2));
                } else {
                    newIndices.push(index.getX(i + 2));
                    newIndices.push(index.getX(i + 1));
                    newIndices.push(index.getX(i));
                }
            }
        }

        if ((newIndices.length / 3) !== numberOfTriangles) {
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GeometryLoader.convertToTriangleMode:Unable to generate correct amount of triangle.'));
            return geometry;
        }

        const newGeometry = geometry.clone();
        newGeometry.setIndex(newIndices);
        return newGeometry;
    }

    // #endregion Private Methods (1)
}