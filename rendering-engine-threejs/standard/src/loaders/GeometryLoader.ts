import * as THREE from 'three'
import {
    AttributeData,
    GeometryData,
    MATERIAL_SIDE,
    IMaterialAbstractData,
    PRIMITIVE_MODE,
    IPrimitiveData,
    IAttributeData,
    MaterialGemData,
    MaterialStandardData,
} from '@shapediver/viewer.shared.types'
import { IBox } from '@shapediver/viewer.shared.math'
import { Logger, LOGGING_TOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

import { RenderingEngine } from '../RenderingEngine'
import { ILoader } from '../interfaces/ILoader'
import { SpecularGlossinessMaterial } from '../materials/SpecularGlossinessMaterial'
import { MaterialSettings } from './MaterialLoader'
import { GemMaterial } from '../materials/GemMaterial'
import { mat4, mat3, vec3 } from 'gl-matrix'
import { SDData } from '../objects/SDData'
import { SDObject } from '../objects/SDObject'

export class GeometryLoader implements ILoader {
    // #region Properties (3)

    private readonly _defaultColor: string = '#00fff7';
    
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
    private _gemSphericalMapsCache: {
        [key: string]: THREE.CubeTexture
    } = {};
    private _gemNormalMaterial?: THREE.ShaderMaterial;

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
    public load(geometry: GeometryData, parent: SDObject, skeleton?: THREE.Skeleton): IBox {
        if (this._geometryCache[geometry.id + '_' + geometry.version]) {
            let incomingMaterialData: IMaterialAbstractData | null;
            if (geometry.primitive.effectMaterials.length > 0) {
                incomingMaterialData = geometry.primitive.effectMaterials[geometry.primitive.effectMaterials.length - 1].material
            } else if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
                incomingMaterialData = geometry.primitive.attributeMaterial;
            } else {
                incomingMaterialData = geometry.primitive.material;
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

            if (incomingMaterialData instanceof MaterialGemData) {
                const gemMaterialData = <MaterialGemData>incomingMaterialData;
                if (!threeGeometry.boundingSphere) threeGeometry.computeBoundingSphere();

                let sphericalNormalMap = this.createCubeNormalMap(geometry, threeGeometry);

                let center = threeGeometry.boundingSphere!.center,
                    radius = threeGeometry.boundingSphere!.radius;

                gemMaterialData.side = MATERIAL_SIDE.FRONT;

                gemMaterialData.inverseModelMatrix = mat4.fromValues(...parent.matrixWorld.toArray());
                gemMaterialData.inverseTransposeModelMatrix = mat3.normalFromMat4(mat3.create(), mat4.transpose(mat4.create(), mat4.invert(mat4.create(), mat4.clone(gemMaterialData.inverseModelMatrix))));
                gemMaterialData.center = vec3.fromValues(center.x, center.y, center.z);
                gemMaterialData.radius = radius;
                (<any>gemMaterialData.sphericalNormalMap) = sphericalNormalMap;
            }

            const material = this._renderingEngine.materialLoader.load(incomingMaterialData || geometry, materialSettings);

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

            obj.children.forEach(m => m.castShadow = true);
            if(material instanceof GemMaterial) {
                obj.children.forEach(m => m.receiveShadow = false);
            } else {
                obj.children.forEach(m => m.receiveShadow = true);
            }

            parent.add(obj);
        } else {
            const threeGeometry = this.loadGeometry(geometry.primitive);

            let incomingMaterialData: IMaterialAbstractData | null;
            if (geometry.primitive.effectMaterials.length > 0) {
                incomingMaterialData = geometry.primitive.effectMaterials[geometry.primitive.effectMaterials.length - 1].material
            } else if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
                incomingMaterialData = geometry.primitive.attributeMaterial;
            } else {
                incomingMaterialData = geometry.primitive.material;
            }

            const materialSettings = {
                mode: geometry.primitive.mode,
                useVertexTangents: threeGeometry.attributes.tangent !== undefined,
                useVertexColors: threeGeometry.attributes.color !== undefined && this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
                useFlatShading: threeGeometry.attributes.normal === undefined,
                useMorphTargets: Object.keys(threeGeometry.morphAttributes).length > 0,
                useMorphNormals: Object.keys(threeGeometry.morphAttributes).length > 0 && threeGeometry.morphAttributes.normal !== undefined
            }

            if (incomingMaterialData instanceof MaterialGemData) {
                const gemMaterialData = <MaterialGemData>incomingMaterialData;
                if (!threeGeometry.boundingSphere) threeGeometry.computeBoundingSphere();

                let sphericalNormalMap = this.createCubeNormalMap(geometry, threeGeometry);

                let center = threeGeometry.boundingSphere!.center,
                    radius = threeGeometry.boundingSphere!.radius;

                gemMaterialData.side = MATERIAL_SIDE.FRONT;

                gemMaterialData.inverseModelMatrix = mat4.fromValues(...parent.matrixWorld.toArray());
                gemMaterialData.inverseTransposeModelMatrix = mat3.normalFromMat4(mat3.create(), mat4.transpose(mat4.create(), mat4.invert(mat4.create(), mat4.clone(gemMaterialData.inverseModelMatrix))));
                gemMaterialData.center = vec3.fromValues(center.x, center.y, center.z);
                gemMaterialData.radius = radius;
                (<any>gemMaterialData.sphericalNormalMap) = sphericalNormalMap;
            }

            const material = this._renderingEngine.materialLoader.load(incomingMaterialData || geometry, materialSettings);

            const obj = new SDData(geometry.id, geometry.version);
            this.createMesh(obj, geometry, threeGeometry, material, materialSettings, skeleton);

            obj.children.forEach(m => m.castShadow = true);
            if(material instanceof GemMaterial) {
                obj.children.forEach(m => m.receiveShadow = false);
            } else {
                obj.children.forEach(m => m.receiveShadow = true);
            }

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
                if (this.checkNormals(primitive, attributeId, buffer, geometry))
                    continue;

            geometry.setAttribute(attributeName, buffer)

            if (primitive.indices)
                geometry.setIndex(new THREE.BufferAttribute(primitive.indices!.array, primitive.indices!.itemSize));

            const morphAttributeData = primitive.attributes[attributeId].morphAttributeData;
            if (morphAttributeData.length > 0) {
                geometry.morphTargetsRelative = true;
                const buffers: (THREE.BufferAttribute | THREE.InterleavedBufferAttribute)[] = [];
                for (let i = 0; i < morphAttributeData.length; i++)
                    buffers.push(this.loadAttribute(morphAttributeData[i], attributeId));
                geometry.morphAttributes[attributeName] = buffers;

            }

            // we copy the uv coordinates into the second set of uv coordinates if there are none
            // this allows for the usage of AO and light maps that share this coordinate set
            const attributeIdUV2 = 'TEXCOORD_1', attributeNameUV2 = 'uv2';
            if (attributeName === 'uv' && !primitive.attributes[attributeIdUV2]) {
                geometry.setAttribute(attributeNameUV2, buffer)

                const morphAttributeData = primitive.attributes[attributeId].morphAttributeData;
                if (morphAttributeData.length > 0) {
                    geometry.morphTargetsRelative = true;
                    const buffers: (THREE.BufferAttribute | THREE.InterleavedBufferAttribute)[] = [];
                    for (let i = 0; i < morphAttributeData.length; i++)
                        buffers.push(this.loadAttribute(morphAttributeData[i], attributeId));
                    geometry.morphAttributes[attributeNameUV2] = buffers;
                }
            }
        }
        primitive.threeJsObject[this._renderingEngine.id] = geometry;
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

    private createCubeNormalMap(geometryData: GeometryData, geometry: THREE.BufferGeometry, resolution = 1024) {
        if (this._gemSphericalMapsCache[geometryData.id + '_' + geometryData.version])
            return this._gemSphericalMapsCache[geometryData.id + '_' + geometryData.version];

        let gemScene = new THREE.Scene();
        let gemCubeCameraRenderTarget = new THREE.WebGLCubeRenderTarget(resolution, { format: THREE.RGBAFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter })
        gemCubeCameraRenderTarget.texture.generateMipmaps = false;
        gemCubeCameraRenderTarget.texture.minFilter = THREE.NearestFilter;
        gemCubeCameraRenderTarget.texture.magFilter = THREE.NearestFilter;
        gemCubeCameraRenderTarget.texture.format = THREE.RGBAFormat;
        let gemCubeCamera = new THREE.CubeCamera(0.001, 10000, gemCubeCameraRenderTarget);
        gemScene.add(gemCubeCamera);

        if (!this._gemNormalMaterial) {
            let _normalShader = {
                defines: {},
                uniforms: THREE.UniformsUtils.merge([
                    THREE.UniformsLib.common]),
                vertexShader: `
                varying vec3 vNormal;

                void main() {
                  vNormal = normal;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
                `,
                fragmentShader: `
                varying highp vec3 vNormal;

                float decodeFloat(float f) {
                    float r = mod(f, 1.0/255.0);
                    return /*r > 0.5/256.0 ? f + (1.0/256.0) - r : */f - r;
                }
                
                vec3 decodeVec3(vec3 v) {
                    return vec3(decodeFloat(v.x), decodeFloat(v.y), decodeFloat(v.z));
                }
                
                float signEncoding(vec3 v) {
                    float code = 1.0;
                     if(v.x < 0.0 && v.y < 0.0 && v.z < 0.0) {
                        code = 0.0;
                    } else if (v.x < 0.0 && v.y < 0.0) {
                        code = 2.0/256.0;
                    } else if (v.x < 0.0 && v.z < 0.0) {
                        code = 4.0/256.0;
                    } else if (v.y < 0.0 && v.z < 0.0) {
                        code = 6.0/256.0;
                    } else if (v.x < 0.0) {
                        code = 8.0/256.0;
                    } else if (v.y < 0.0) {
                        code = 10.0/256.0;
                    } else if (v.z < 0.0) {
                        code = 12.0/256.0;
                    }
                    return code;
                }
                
                void main() {
                    vec3 n = normalize(vNormal);
                    gl_FragColor = vec4(decodeVec3(abs(n)), signEncoding(n));
                }
                `
            };

            this._gemNormalMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(_normalShader.uniforms),
                defines: _normalShader.defines,
                vertexShader: _normalShader.vertexShader,
                fragmentShader: _normalShader.fragmentShader
            });

            this._gemNormalMaterial.blending = THREE.NoBlending;
            this._gemNormalMaterial.side = THREE.DoubleSide;
            gemScene.overrideMaterial = this._gemNormalMaterial;
        }

        let mesh = new THREE.Mesh(geometry.clone(), this._gemNormalMaterial);
        mesh.geometry.center();
        gemScene.add(mesh);

        gemCubeCamera.update(this._renderingEngine.renderer, gemScene);
        gemScene.remove(mesh);

        this._gemSphericalMapsCache[geometryData.id + '_' + geometryData.version] = gemCubeCamera.renderTarget.texture;
        return this._gemSphericalMapsCache[geometryData.id + '_' + geometryData.version];
    }

    private createMesh(obj: SDData, geometry: GeometryData, threeGeometry: THREE.BufferGeometry, material: THREE.Material, materialSettings: MaterialSettings, skeleton?: THREE.Skeleton) {
        if (geometry.primitive.mode === PRIMITIVE_MODE.POINTS) {
            const points = new THREE.Points(threeGeometry, material);
            geometry.threeJsObject[this._renderingEngine.id] = points;
            obj.add(points);
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINES) {
            const lineSegments = new THREE.LineSegments(threeGeometry, material);
            geometry.threeJsObject[this._renderingEngine.id] = lineSegments;
            obj.add(lineSegments);
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINE_LOOP) {
            const lineLoop = new THREE.LineLoop(threeGeometry, material);
            geometry.threeJsObject[this._renderingEngine.id] = lineLoop;
            obj.add(lineLoop);
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.LINE_STRIP) {
            const line = new THREE.Line(threeGeometry, material);
            geometry.threeJsObject[this._renderingEngine.id] = line;
            obj.add(line);
        } else if (geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLES || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_STRIP || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_FAN) {
            let bufferGeometry = threeGeometry;
            if (geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_STRIP || geometry.primitive.mode === PRIMITIVE_MODE.TRIANGLE_FAN)
                bufferGeometry = this.convertToTriangleMode(bufferGeometry, geometry.primitive.mode);

            if (skeleton) {
                const skinnedMesh = new THREE.SkinnedMesh(bufferGeometry, material);
                geometry.threeJsObject[this._renderingEngine.id] = skinnedMesh;
                skinnedMesh.bind(skeleton, skinnedMesh.matrixWorld);

                if (bufferGeometry.attributes.skinWeight.normalized)
                    skinnedMesh.normalizeSkinWeights();

                obj.add(skinnedMesh);
            } else {

                if (material.opacity < 1 || (<THREE.MeshPhysicalMaterial | SpecularGlossinessMaterial>material).alphaMap) {
                    const side = material.side;
                    if (side === THREE.DoubleSide) {
                        const baseMesh = new THREE.Mesh();
                        baseMesh.userData.transparencyPlaceholder = true;
                        geometry.threeJsObject[this._renderingEngine.id] = baseMesh;
                        obj.add(baseMesh);

                        const materialBack = material.clone();
                        materialBack.side = THREE.BackSide;
                        baseMesh.add(new THREE.Mesh(bufferGeometry, materialBack));
                        const materialFront = material.clone();
                        materialFront.side = THREE.FrontSide;
                        baseMesh.add(new THREE.Mesh(bufferGeometry, materialFront));
                    } else {
                        const mesh = new THREE.Mesh(bufferGeometry, material);
                        geometry.threeJsObject[this._renderingEngine.id] = mesh;
                        obj.add(mesh);
                    }
                } else {
                    const mesh = new THREE.Mesh(bufferGeometry, material);
                    geometry.threeJsObject[this._renderingEngine.id] = mesh;
                    obj.add(mesh);
                }
            }
        } else {
            const error = new ShapeDiverViewerDataProcessingError(`GeometryLoader.load: Unrecognized primitive mode ${geometry.primitive.mode}.`);
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GeometryLoader.load`, error);
        }

        obj.children.forEach(m => {
            if(m.userData.transparencyPlaceholder !== true) {
                (<THREE.Mesh>m).geometry.boundingBox = new THREE.Box3(new THREE.Vector3(geometry.boundingBox.min[0], geometry.boundingBox.min[1], geometry.boundingBox.min[2]), new THREE.Vector3(geometry.boundingBox.max[0], geometry.boundingBox.max[1], geometry.boundingBox.max[2]));
                (<THREE.Mesh>m).geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(geometry.boundingBox.boundingSphere.center[0], geometry.boundingBox.boundingSphere.center[1], geometry.boundingBox.boundingSphere.center[2]), geometry.boundingBox.boundingSphere.radius);
                (<THREE.Mesh>m).geometry.userData = {
                    SDid: geometry.id,
                    SDversion: geometry.version
                };
                m.renderOrder = geometry.renderOrder;
                (<THREE.Mesh>m).morphTargetInfluences = geometry.morphWeights;
            }
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