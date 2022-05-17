import * as THREE from 'three'
import {
  AttributeData,
  GeometryData,
  MATERIAL_ALPHA,
  MATERIAL_SIDE,
  IMaterialData,
  PRIMITIVE_MODE,
  PrimitiveData,
  IPrimitiveData,
  IAttributeData,
} from '@shapediver/viewer.shared.types'
import { Box, IBox } from '@shapediver/viewer.shared.math'
import { Logger, LOGGING_TOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

import { SDNode } from '../types/SDNode'
import { RenderingEngine } from '../RenderingEngine'
import { ILoader } from '../interfaces/ILoader'
import { SpecularGlossinessMaterial } from '../materials/SpecularGlossinessMaterial'
import { SDData } from '../types/SDData'
import { MaterialSettings } from './MaterialLoader'

export class GeometryLoader implements ILoader {
    // #region Properties (3)

    private _counter: number = 0;
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

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (5)

    public emptyGeometryCache() {
        this._geometryCache = {};
    }

    public init(): void { }

    /**
     * Create a geometry object with the provided geometry data.
     * 
     * @param geometry the geometry data
     * @returns the geometry object
     */
    public load(geometry: GeometryData, parent: SDNode, skeleton?: THREE.Skeleton): IBox {
        if (this._geometryCache[geometry.id + '_' + geometry.version]) {
            let materialData: IMaterialData | null;
            if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
                materialData = geometry.primitive.attributeMaterial;
            } else if (geometry.primitive.effectMaterials.length > 0) {
                materialData = geometry.primitive.effectMaterials[geometry.primitive.effectMaterials.length - 1].material
            } else {
                materialData = geometry.primitive.material;
            }

            const threeGeometry = this._geometryCache[geometry.id + '_' + geometry.version].threeGeometry.clone();
            const materialSettings = {
                mode: geometry.primitive.mode,
                useVertexTangents: threeGeometry.attributes.tangent !== undefined,
                useVertexColors: threeGeometry.attributes.color !== undefined && this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
                useFlatShading: threeGeometry.attributes.normal === undefined,
                useMorphTargets: Object.keys(threeGeometry.morphAttributes).length > 0,
                useMorphNormals: Object.keys(threeGeometry.morphAttributes).length > 0 && threeGeometry.morphAttributes.normal !== undefined
            }

            const material = this._renderingEngine.materialLoader.load(materialData, materialSettings);

            const obj = this._geometryCache[geometry.id + '_' + geometry.version].obj.clone();
            obj.traverse(o => {
                if (
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

            let materialData: IMaterialData | null;
            if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
                materialData = geometry.primitive.attributeMaterial;
            } else if (geometry.primitive.effectMaterials.length > 0) {
                materialData = geometry.primitive.effectMaterials[geometry.primitive.effectMaterials.length - 1].material
            } else {
                materialData = geometry.primitive.material;
            }

            const materialSettings = {
                mode: geometry.primitive.mode,
                useVertexTangents: threeGeometry.attributes.tangent !== undefined,
                useVertexColors: threeGeometry.attributes.color !== undefined && this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
                useFlatShading: threeGeometry.attributes.normal === undefined,
                useMorphTargets: Object.keys(threeGeometry.morphAttributes).length > 0,
                useMorphNormals: Object.keys(threeGeometry.morphAttributes).length > 0 && threeGeometry.morphAttributes.normal !== undefined
            }

            const material = this._renderingEngine.materialLoader.load(materialData, materialSettings);

            const obj = new SDData(geometry.id, geometry.version);
            this.createMesh(obj, geometry, threeGeometry, material, materialSettings, skeleton);
            parent.add(obj);
        }

        return geometry.boundingBox.clone().applyMatrix(geometry.matrix);
    }

    public loadGeometry(primitive: IPrimitiveData): THREE.BufferGeometry {
        let geometry = new THREE.BufferGeometry();
        for (let attributeId in primitive.attributes) {
            const buffer = this.loadAttribute(primitive.attributes[attributeId], attributeId);
            const attributeName = this.getAttributeName(attributeId);

            if (attributeId === 'NORMAL')
                if(this.checkNormals(primitive, attributeId, buffer, geometry))
                    continue;

            geometry.setAttribute(attributeName, buffer)

            if (primitive.indices)
                geometry.setIndex(new THREE.BufferAttribute(primitive.indices!.array, primitive.indices!.itemSize));

            const morphAttributeData = primitive.attributes[attributeId].morphAttributeData;
            if(morphAttributeData.length > 0) {
                geometry.morphTargetsRelative = true;
                const buffers: (THREE.BufferAttribute | THREE.InterleavedBufferAttribute)[] = [];
                for(let i = 0; i < morphAttributeData.length; i++)
                    buffers.push(this.loadAttribute(morphAttributeData[i], attributeId));
                geometry.morphAttributes[attributeName] = buffers;

            }

            // we copy the uv coordinates into the second set of uv coordinates if there are none
            // this allows for the usage of AO and light maps that share this coordinate set
            const attributeIdUV2 = 'TEXCOORD_1', attributeNameUV2 = 'uv2';
            if(attributeName === 'uv' && !primitive.attributes[attributeIdUV2]) {
                geometry.setAttribute(attributeNameUV2, buffer)

                const morphAttributeData = primitive.attributes[attributeId].morphAttributeData;
                if(morphAttributeData.length > 0) {
                    geometry.morphTargetsRelative = true;
                    const buffers: (THREE.BufferAttribute | THREE.InterleavedBufferAttribute)[] = [];
                    for(let i = 0; i < morphAttributeData.length; i++)
                        buffers.push(this.loadAttribute(morphAttributeData[i], attributeId));
                    geometry.morphAttributes[attributeNameUV2] = buffers;
                }
            }
        }
        return geometry;
    }

    public removeFromGeometryCache(id: string) {
        if (this._geometryCache[id])
            delete this._geometryCache[id];
    }

    // #endregion Public Methods (5)

    // #region Private Methods (5)

    private checkNormals(primitive: IPrimitiveData, attributeId: string, buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute, geometry: THREE.BufferGeometry): boolean {
        let blnNormalsOk = false;
        for (let index = 0; index < 10; ++index) {
          if (Math.abs(buffer.array[index * 3]) > 0.001) {
            blnNormalsOk = true;
            break;
          }
          if (
            Math.abs(buffer.array[index * 3 + 1]) > 0.001
          ) {
            blnNormalsOk = true;
            break;
          }
          if (
            Math.abs(buffer.array[index * 3 + 2]) > 0.001
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
            return true;
        }
        return false;
    }

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
                throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.convertToTriangleMode`, error);
            }
        }

        if (index === null) {
            const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.convertToTriangleMode: Undefined index. Processing not possible.`);
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.convertToTriangleMode`, error);
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
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.convertToTriangleMode`, error);
        }

        const newGeometry = geometry.clone();
        newGeometry.setIndex(newIndices);
        return newGeometry;
    }

    private createMesh(obj: SDData, geometry: GeometryData, threeGeometry: THREE.BufferGeometry, material: THREE.Material, materialSettings: MaterialSettings, skeleton?: THREE.Skeleton) {
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

            if(skeleton) {
                const skinnedMesh = new THREE.SkinnedMesh(bufferGeometry, material);
                skinnedMesh.bind(skeleton, skinnedMesh.matrixWorld);

                if (bufferGeometry.attributes.skinWeight.normalized)
                    skinnedMesh.normalizeSkinWeights();

                obj.add(skinnedMesh);
            } else {

                if (material.opacity < 1 || (<THREE.MeshPhysicalMaterial | SpecularGlossinessMaterial>material).alphaMap) {
                    const side = material.side;
                    if (side === THREE.DoubleSide) {
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
            }
            obj.children.forEach(m => m.castShadow = true);
            obj.children.forEach(m => m.receiveShadow = true);
        } else {
            const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.load: Unrecognized primitive mode ${geometry.primitive.mode}.`);
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.load`, error);
        }

        obj.children.forEach(m => {
            (<THREE.Mesh>m).geometry.boundingBox = new THREE.Box3(new THREE.Vector3(geometry.boundingBox.min[0], geometry.boundingBox.min[1], geometry.boundingBox.min[2]), new THREE.Vector3(geometry.boundingBox.max[0], geometry.boundingBox.max[1], geometry.boundingBox.max[2]));
            (<THREE.Mesh>m).geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(geometry.boundingBox.boundingSphere.center[0], geometry.boundingBox.boundingSphere.center[1], geometry.boundingBox.boundingSphere.center[2]), geometry.boundingBox.boundingSphere.radius);
            (<THREE.Mesh>m).geometry.userData = {
                SDid: geometry.id,
                SDversion: geometry.version
            };
            m.renderOrder = geometry.renderOrder;
            (<THREE.Mesh>m).morphTargetInfluences = geometry.morphWeights;
            obj.add(m)
        });

        this._geometryCache[geometry.id + '_' + geometry.version] = { obj, threeGeometry, materialSettings };
    }

    private getAttributeName(attributeId: string): string {
        switch (attributeId) {
            case 'POSITION':
                return 'position';
            case 'NORMAL':
                return 'normal';
            case 'TEXCOORD_0':
            case 'TEXCOORD0':
            case 'TEXCOORD':
            case 'UV':
                return 'uv';
            case 'TEXCOORD_1':
                return 'uv2';
            case 'COLOR_0':
            case 'COLOR0':
            case 'COLOR':
                return 'color';
            case 'WEIGHT':
            case 'WEIGHTS_0':
                return 'skinWeight';
            case 'JOINT':
            case 'JOINTS_0':
                return 'skinIndex';
            case 'TANGENT':
                return 'tangent';
            default:
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.loadGeometry: Unrecognized attribute id ${attributeId}.`);
        }
        return '';
    }

    private loadAttribute(bufferAttribute: IAttributeData, attributeId: string) {
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
                    throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.loadGeometry`, error);
                }
            }
        }
        return buffer;
    }

    // #endregion Private Methods (5)
}