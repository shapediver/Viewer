import * as THREE from 'three'
import {
  GeometryData,
  MATERIAL_ALPHA,
  PRIMITIVE_MODE,
  PrimitiveData,
  MATERIAL_SIDE,
  MaterialData,
  AttributeData,
} from '@shapediver/viewer.shared.types'
import { Box } from '@shapediver/viewer.shared.math'
import { Logger, LOGGINGTOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { SDNode } from '../types/SDNode'
import { RenderingEngine } from '../RenderingEngine'
import { ILoader } from '../interfaces/ILoader'
import { SpecularGlossinessMaterial } from '../materials/SpecularGlossinessMaterial'
import { SDData } from '../types/SDData'
import { MaterialSettings } from './MaterialLoader'
import { RENDERERTYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

export class GeometryLoader implements ILoader {
    // #region Properties (2)

    private _geometryCache: {
        [key: string]: {
            obj: SDData,
            threeGeometry: THREE.BufferGeometry,
            materialSettings: {
                mode: PRIMITIVE_MODE,
                useVertexTangents: boolean,
                useVertexColors: boolean,
                useFlatShading: boolean,
                useMorphTargets: boolean,
                useMorphNormals: boolean
            }
        }
    } = {};
    private _logger: Logger = <Logger>container.resolve(Logger);
    private _counter: number = 0;

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

    private createMesh(obj: SDData, geometry: GeometryData, threeGeometry: THREE.BufferGeometry, material: THREE.Material, materialSettings: MaterialSettings) {
        if (geometry.primitive.mode === PRIMITIVE_MODE.POINTS) {
            obj.add(new THREE.Points(threeGeometry, material));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINES) {
            obj.add(new THREE.LineSegments(threeGeometry, material));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINE_LOOP) {
            obj.add(new THREE.LineLoop(threeGeometry, material));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINE_STRIP) {
            obj.add(new THREE.Line(threeGeometry, material));
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLES || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_STRIP || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_FAN) {
            let bufferGeometry = threeGeometry;
            if (geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_STRIP || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_FAN)
                bufferGeometry = this.convertToTriangleMode(bufferGeometry, geometry.primitive.mode);

            if(material.opacity < 1 || (<THREE.MeshStandardMaterial | SpecularGlossinessMaterial>material).alphaMap) {
                const side = material.side;
                if(side === THREE.DoubleSide) {
                    const materialBack = material.clone();
                    materialBack.side = THREE.BackSide;
                    obj.add(new THREE.Mesh(bufferGeometry, materialBack));
                    const materialFront = material.clone();
                    materialFront.side = THREE.FrontSide;
                    obj.add(new THREE.Mesh(bufferGeometry, materialFront));
                } else {
                    obj.add(new THREE.Mesh(bufferGeometry, material));
                }
            } else {
                obj.add(new THREE.Mesh(bufferGeometry, material));
            }
            obj.children.forEach(m => m.castShadow = true);
            obj.children.forEach(m => m.receiveShadow = true);
        } else {
            const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.load: Unrecognized primitive mode ${geometry.primitive.mode}.`);
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GeometryLoader.load`, error);
        }

        obj.children.forEach(m => {
            (<THREE.Mesh>m).geometry.boundingBox = new THREE.Box3(new THREE.Vector3(geometry.boundingBox.min[0],  geometry.boundingBox.min[1],  geometry.boundingBox.min[2]), new THREE.Vector3(geometry.boundingBox.max[0],  geometry.boundingBox.max[1],  geometry.boundingBox.max[2]));
            (<THREE.Mesh>m).geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(geometry.boundingBox.boundingSphere.center[0], geometry.boundingBox.boundingSphere.center[1], geometry.boundingBox.boundingSphere.center[2]), geometry.boundingBox.boundingSphere.radius);
            (<THREE.Mesh>m).geometry.userData = {
                SDid: geometry.id,
                SDversion: geometry.version
            };
            m.renderOrder = geometry.renderOrder;
            obj.add(m)
        });

        this._geometryCache[geometry.id + '_' + geometry.version] = {obj, threeGeometry, materialSettings};
    }

    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
    public load(geometry: GeometryData, parent: SDNode): Box {    
        if(this._geometryCache[geometry.id + '_' + geometry.version]) {
            let materialData: MaterialData | null;
            if(this._renderingEngine.type === RENDERERTYPE.ATTRIBUTES) {
                materialData = geometry.primitive.attributeMaterial;
            } else if(geometry.primitive.effectMaterials.length > 0) {
                materialData = geometry.primitive.effectMaterials[geometry.primitive.effectMaterials.length - 1].material
            } else {
                materialData = geometry.primitive.material;
            }

            const threeGeometry = this._geometryCache[geometry.id + '_' + geometry.version].threeGeometry.clone();
            const materialSettings = {
                mode: geometry.primitive.mode,
                useVertexTangents: threeGeometry.attributes.tangent !== undefined,
                useVertexColors: threeGeometry.attributes.color !== undefined && this._renderingEngine.type !== RENDERERTYPE.ATTRIBUTES,
                useFlatShading: threeGeometry.attributes.normal === undefined,
                useMorphTargets: Object.keys(threeGeometry.morphAttributes).length > 0,
                useMorphNormals: Object.keys(threeGeometry.morphAttributes).length > 0 && threeGeometry.morphAttributes.normal !== undefined
            }

            const material = this._renderingEngine.materialLoader.load(materialData, materialSettings);

            const obj = this._geometryCache[geometry.id + '_' + geometry.version].obj.clone();
            obj.traverse(o => {
                if(
                    o instanceof THREE.Points || 
                    o instanceof THREE.LineSegments || 
                    o instanceof THREE.LineLoop || 
                    o instanceof THREE.Line || 
                    o instanceof THREE.Mesh)
                    o.material = material;
            })
            parent.add(obj);
        } else {
            const threeGeometry = this.loadGeometry(geometry.primitive);

            let materialData: MaterialData | null;
            if(this._renderingEngine.type === RENDERERTYPE.ATTRIBUTES) {
                materialData = geometry.primitive.attributeMaterial;
            } else if(geometry.primitive.effectMaterials.length > 0) {
                materialData = geometry.primitive.effectMaterials[geometry.primitive.effectMaterials.length - 1].material
            } else {
                materialData = geometry.primitive.material;
            }

            const materialSettings = {
                mode: geometry.primitive.mode,
                useVertexTangents: threeGeometry.attributes.tangent !== undefined,
                useVertexColors: threeGeometry.attributes.color !== undefined && this._renderingEngine.type !== RENDERERTYPE.ATTRIBUTES,
                useFlatShading: threeGeometry.attributes.normal === undefined,
                useMorphTargets: Object.keys(threeGeometry.morphAttributes).length > 0,
                useMorphNormals: Object.keys(threeGeometry.morphAttributes).length > 0 && threeGeometry.morphAttributes.normal !== undefined
            }

            const material = this._renderingEngine.materialLoader.load(materialData, materialSettings);

            const obj = new SDData(geometry.id, geometry.version);
            this.createMesh(obj, geometry, threeGeometry, material, materialSettings);
            parent.add(obj);
        }

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
                buffer = new THREE.BufferAttribute(bufferAttribute.array, bufferAttribute.itemSize, (attributeId === 'COLOR_0' || attributeId === 'COLOR0' || attributeId === 'COLOR') ? true : bufferAttribute.normalized);
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
                    if (bufferAttribute.itemSize >= 5) {
                        const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.loadGeometry: Unsupported itemSize in sparse BufferAttribute.`);
                        throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GeometryLoader.loadGeometry`, error);
                    }
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
                    const computedNormalAttribute = geometry.getAttribute('normal');
  
                    // store the computed normals in the attribute data
                    primitive.attributes[attributeId] = new AttributeData(
                        new Float32Array(computedNormalAttribute.array), 
                        computedNormalAttribute.itemSize,
                        0,
                        0,
                        3,
                        computedNormalAttribute.normalized,
                        computedNormalAttribute.array.length / 3);
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
                    //geometry.setAttribute('skinWeight', buffer);
                    break;
                case 'JOINT':
                    //geometry.setAttribute('skinIndex', buffer);
                    break;
                case 'TANGENT':
                    geometry.setAttribute('tangent', buffer);
                    break;
                default:
                    this._logger.warn(LOGGINGTOPIC.DATA_PROCESSING, `GeometryLoader.loadGeometry: Unrecognized attribute id ${attributeId}.`);
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
                const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.convertToTriangleMode: Undefined position attribute. Processing not possible.`);
                throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GeometryLoader.convertToTriangleMode`, error);
            }
        }

        if (index === null) {
            const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.convertToTriangleMode: Undefined index. Processing not possible.`);
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GeometryLoader.convertToTriangleMode`, error);
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
            const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.convertToTriangleMode: Unable to generate correct amount of triangle.`);
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GeometryLoader.convertToTriangleMode`, error);
        }

        const newGeometry = geometry.clone();
        newGeometry.setIndex(newIndices);
        return newGeometry;
    }

    // #endregion Private Methods (1)
}