import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  Converter,
  HttpClient,
  Logger,
  LOGGINGTOPIC,
  PerformanceEvaluator,
  ShapeDiverViewerDataProcessingError,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import {
  ACCESSORCOMPONENTTYPE_V2 as ACCESSOR_COMPONENTTYPE,
  ACCESSORTYPE_V2 as ACCESSORTYPE,
  IGLTF_v2,
  IGLTF_v2_Material,
  IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness,
  IGLTF_v2_Primitive,
  ISHAPEDIVER_materials_preset,
} from '@shapediver/viewer.data-engine.shared-types'
import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
import {
  AnimationData,
  AnimationTrack,
  AttributeData,
  GeometryData,
  MapData,
  MATERIAL_ALPHA,
  MATERIAL_SIDE,
  MaterialData,
  PrimitiveData,
  PerspectiveCameraData,
  OrthographicCameraData,
} from '@shapediver/viewer.shared.types'
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine'
import { AxiosResponse } from 'axios'

export enum GLTF_EXTENSIONS {
    KHR_BINARY_GLTF = 'KHR_binary_glTF',
    KHR_MATERIALS_PBRSPECULARGLOSSINESS = 'KHR_materials_pbrSpecularGlossiness',
    KHR_MATERIALS_UNLIT = 'KHR_materials_unlit',
    SHAPEDIVER_MATERIALS_PRESET = 'SHAPEDIVER_materials_preset'
}
export class GLTFLoader {
    // #region Properties (14)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _globalTransformation = mat4.fromValues(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _materialEngine: MaterialEngine = <MaterialEngine>container.resolve(MaterialEngine);
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _baseUri: string | undefined;
    private _body: ArrayBuffer | undefined;
    private _content!: IGLTF_v2;
    private _loadData: (img: string) => Promise<AxiosResponse<any>> = this._httpClient.loadData.bind(this._httpClient);
    private _loaded: {
        [key: string]: {
            [key: string]: any
        }
    } = {};
    private _nodes: {
        [key: number]: TreeNode
    } = {};

    // #endregion Properties (14)

    // #region Public Methods (2)

    public async load(content: IGLTF_v2, gltfBinary?: ArrayBuffer, gltfHeader?: { magic: string, version: number, length: number, contentLength: number, contentFormat: number }, baseUri?: string): Promise<TreeNode> {
        this._baseUri = baseUri;
        if (gltfBinary && gltfHeader)
            this._body = gltfBinary.slice(this.BINARY_EXTENSION_HEADER_LENGTH + gltfHeader.contentLength + 8, gltfHeader.length);
        this._content = content;

        try {
            this.validateVersionAndExtensions();
            const node = await this.loadScene();
            if (this._content.skins !== undefined && this._content.nodes !== undefined) {
                for (let i = 0; i < this._content.nodes?.length; i++) {
                    if(this._content.nodes[i].skin !== undefined) {
                        const skinDef = await this.loadSkin(this._content.nodes[i].skin!);

                        const skinNode = this._nodes[i];
                        
                        const bones: TreeNode[] = [];
                        const boneInverses: mat4[] = [];

                        for(let j = 0; j < skinDef.joints.length; j++) {
                            this._nodes[skinDef.joints[j]].bone = true;
                            bones.push(this._nodes[skinDef.joints[j]]);

                            let mat = mat4.create();
                            if ( skinDef.inverseBindMatrices !== undefined ) {
                                const matricesArray = skinDef.inverseBindMatrices!.array;
                                mat = mat4.fromValues(matricesArray[j * 16 + 0], matricesArray[j * 16 + 1], matricesArray[j * 16 + 2], matricesArray[j * 16 + 3],
                                    matricesArray[j * 16 + 4], matricesArray[j * 16 + 5], matricesArray[j * 16 + 6], matricesArray[j * 16 + 7],
                                    matricesArray[j * 16 + 8], matricesArray[j * 16 + 9], matricesArray[j * 16 + 10], matricesArray[j * 16 + 11],
                                    matricesArray[j * 16 + 12], matricesArray[j * 16 + 13], matricesArray[j * 16 + 14], matricesArray[j * 16 + 15]);
                            }
                            boneInverses.push(mat);
                        }

                        const addBones = (node: TreeNode) => {
                            for(let j = 0; j < node.data.length; j++)
                                if(node.data[j] instanceof GeometryData) {
                                    (<GeometryData>node.data[j]).bones = bones;
                                    (<GeometryData>node.data[j]).boneInverses = boneInverses;
                                }

                            for (let l = 0; l < node.children.length; l++)
                                addBones(node.children[l])
                        }
                        addBones(skinNode);
                    }
                }
            }

            if (this._content.animations)
                for (let i = 0; i < this._content.animations?.length; i++)
                    node.data.push(await this.loadAnimation(i));
            return node;
        } catch (e) {
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GLTFLoader.load`, e);
        }
    }

    public async loadWithUrl(url?: string | undefined): Promise<TreeNode> {
        this._performanceEvaluator.startSection('gltfProcessing.' + url);
        let axiosResponse;

        try {
            this._performanceEvaluator.startSection('loadGltf.' + url);
            axiosResponse = await this._httpClient.get(url!, {
                responseType: 'arraybuffer'
            });
            this._performanceEvaluator.endSection('loadGltf.' + url);
        } catch (e) {
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GLTFLoader.load`, e);
        }

        const magic = new TextDecoder().decode(new Uint8Array(axiosResponse.data, 0, 4));
        const isBinary = magic === 'glTF' || (axiosResponse.headers['content-type'] &&
            (axiosResponse.headers['content-type'] === 'model/gltf-binary' ||
                axiosResponse.headers['content-type'] === 'application/octet-stream' ||
                axiosResponse.headers['content-type'] === 'model/gltf.binary'));

        if (isBinary) {
            const binaryGeometry: ArrayBuffer = axiosResponse.data;
            // create header data
            const headerDataView = new DataView(binaryGeometry, 0, this.BINARY_EXTENSION_HEADER_LENGTH);
            const header = {
                magic: magic,
                version: headerDataView.getUint32(4, true),
                length: headerDataView.getUint32(8, true),
                contentLength: headerDataView.getUint32(12, true),
                contentFormat: headerDataView.getUint32(16, true)
            }
            if (header.magic != 'glTF') {
                const error = new ShapeDiverViewerDataProcessingError('GLTFLoader.load: Invalid data: sdgTF magic wrong.');
                throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GLTFLoader.load`, error);
            }
            // create content
            const contentDataView = new DataView(binaryGeometry, this.BINARY_EXTENSION_HEADER_LENGTH, header.contentLength);
            const contentDecoded = new TextDecoder().decode(contentDataView);
            this._content = JSON.parse(contentDecoded);

            // create body
            this._body = binaryGeometry.slice(this.BINARY_EXTENSION_HEADER_LENGTH + header.contentLength + 8, header.length);
        } else {
            this._content = JSON.parse(new TextDecoder().decode(axiosResponse.data));

            const removeLastDirectoryPartOf = (the_url: string): string => {
                const dir_char = the_url.includes("/") ? "/" : "\\";
                const the_arr = the_url.split(dir_char);
                the_arr.pop();
                return the_arr.join(dir_char);
            }

            this._baseUri = removeLastDirectoryPartOf(url!);
            if (!this._baseUri && window && window.location && window.location.href)
                this._baseUri = removeLastDirectoryPartOf(window.location.href);
        }

        try {
            this.validateVersionAndExtensions();
            const node = await this.loadScene();
            this._performanceEvaluator.endSection('gltfProcessing.' + url);
            return node;
        } catch (e) {
            throw this._logger.handleError(LOGGINGTOPIC.DATA_PROCESSING, `GLTFLoader.load`, e);
        }
    }

    // #endregion Public Methods (2)

    // #region Private Methods (13)

    private async loadAccessor(accessorId: number): Promise<AttributeData | null> {
        if (!this._content.accessors) throw new Error('Accessors not available.')
        if (!this._content.accessors[accessorId]) throw new Error('Accessor not available.')
        const accessor = this._content.accessors[accessorId];
        if (this._loaded['accessor'] && this._loaded['accessor'][accessorId]) return this._loaded['accessor'][accessorId];

        if (accessor.bufferView === undefined) {
            // Ignore empty accessors, which may be used to declare runtime
            // information about attributes coming from another source (e.g. Draco
            // compression extension).
            return Promise.resolve(null);
        }

        const arrayBuffer = await this.loadBufferView(accessor.bufferView!);

        const itemSize = ACCESSORTYPE[<keyof typeof ACCESSORTYPE>accessor.type];
        if (accessor.componentType === 5124) this._logger.warn(LOGGINGTOPIC.DATA_PROCESSING, 'GLTFLoader.loadAccessor: The componentType for this accessor is 5124, which is not allowed. Trying to load it anyway.');
        const ArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.componentType];

        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;
        const byteOffset = accessor.byteOffset || 0;
        const byteStride = accessor.bufferView !== undefined ? this._content.bufferViews ? this._content.bufferViews[accessor.bufferView].byteStride : undefined : undefined;
        const normalized = accessor.normalized === true;
        let array;

        if (byteStride && byteStride !== itemBytes) {
            // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
            // This makes sure that IBA.count reflects accessor.count properly
            const ibSlice = Math.floor(byteOffset / byteStride);
            array = new ArrayType(arrayBuffer, ibSlice * byteStride, accessor.count * byteStride / elementBytes);
        } else {
            if (arrayBuffer === null) {
                array = new ArrayType(accessor.count * itemSize);
            } else {
                array = new ArrayType(arrayBuffer, byteOffset, accessor.count * itemSize);
            }
        }

        if (accessor.sparse !== undefined) {
            const itemSizeIndices = ACCESSORTYPE.SCALAR;
            const IndicesArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.sparse.indices.componentType];

            const byteOffsetIndices = accessor.sparse.indices.byteOffset || 0;
            const byteOffsetValues = accessor.sparse.values.byteOffset || 0;

            if (!accessor.sparse.indices.bufferView || !accessor.sparse.values.bufferView) throw new Error('Sparse Mesh not properly defined.')

            const sparseIndices = new IndicesArrayType(await this.loadBufferView(accessor.sparse.indices.bufferView!), byteOffsetIndices, accessor.sparse.count * itemSizeIndices);
            const sparseValues = new ArrayType(await this.loadBufferView(accessor.sparse.values.bufferView!), byteOffsetValues, accessor.sparse.count * itemSize);

            if (!this._loaded['accessor']) this._loaded['accessor'] = {};
            this._loaded['accessor'][accessorId] = new AttributeData(array, itemSize, itemBytes, byteOffset, elementBytes, normalized, accessor.count, accessor.min, accessor.max, byteStride, true, sparseIndices, sparseValues);
            return this._loaded['accessor'][accessorId];
        }

        if (!this._loaded['accessor']) this._loaded['accessor'] = {};
        this._loaded['accessor'][accessorId] = new AttributeData(array, itemSize, itemBytes, byteOffset, elementBytes, normalized, accessor.count, accessor.min, accessor.max, byteStride);
        return this._loaded['accessor'][accessorId];
    }

    /**
       * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
       * @param {number} animationIndex
       * @return {Promise<AnimationClip>}
       */
    private async loadAnimation(animationId: number): Promise<AnimationData> {
        if (!this._content.animations) throw new Error('Animations not available.')
        if (!this._content.animations[animationId]) throw new Error('Animations not available.')
        const animationDef = this._content.animations[animationId];
        const animationTracks: AnimationTrack[] = [];
        let min = Infinity, max = -Infinity;

        for (let i = 0; i < animationDef.channels.length; i++) {
            const channel = animationDef.channels[i];
            const sampler = animationDef.samplers[channel.sampler];

            const target = channel.target;
            const path = target.path;
            const node = this._nodes[target.node];
            if (node === undefined) throw new Error('Animation node not available.');

            const input = await this.loadAccessor(sampler.input);
            min = Math.min(min, input!.min[0]);
            max = Math.max(max, input!.max[0]);
            const output = await this.loadAccessor(sampler.output);
            let interpolation = sampler.interpolation;
            if (interpolation === 'CUBICSPLINE') {
                this._logger.warn(LOGGINGTOPIC.DATA_PROCESSING, 'Animation with CUBICSPLINE interpolation is currently not supported. Assigning linear interpolation instead.')
                interpolation = 'linear';
            }

            animationTracks.push({
                node,
                times: input!.array,
                values: output!.array,
                path: <'scale' | 'translation' | 'rotation'>path,
                interpolation: <'linear' | 'step'>interpolation?.toLowerCase()
            });
        }

        return new AnimationData(animationDef.name || 'gltf_animation_' + animationId, animationTracks, min, max - min);
    }

    private async loadBuffer(bufferId: number): Promise<ArrayBuffer> {
        if (!this._content.buffers) throw new Error('Buffers not available.')
        if (!this._content.buffers[bufferId]) throw new Error('Buffer not available.')
        const buffer = this._content.buffers[bufferId];
        if (this._loaded['buffer'] && this._loaded['buffer'][bufferId]) return this._loaded['buffer'][bufferId];

        if (buffer.type && buffer.type !== 'arraybuffer') {
            throw new Error(`GLTFLoader.loadBuffer: ${buffer.type} is not supported.`);
        }

        // If present, GLB container is required to be the first buffer.
        if (buffer.uri === undefined && bufferId === 0) {
            if (!this._body) throw new Error(`GLTFLoader.loadBuffer: Buffer not available.`);
            return Promise.resolve(this._body);
        }

        const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
        const dataUriRegexResult = buffer.uri!.match(dataUriRegex);

        let result: ArrayBuffer;
        // Safari can not handle Data URIs through XMLHttpRequest so process manually
        if (dataUriRegexResult) {
            const isBase64 = !!dataUriRegexResult[2];
            let data = dataUriRegexResult[3];
            data = decodeURIComponent(data);
            if (isBase64) data = atob(data);

            const view = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                view[i] = data.charCodeAt(i);
            }
            result = view.buffer;
        } else {
            let httpResult = await this._httpClient.get(this._baseUri + '/' + buffer.uri!, {
                responseType: 'arraybuffer'
            })
            result = <ArrayBuffer>(httpResult.data);
        }

        if (!this._loaded['buffer']) this._loaded['buffer'] = {};
        this._loaded['buffer'][bufferId] = result;
        return this._loaded['buffer'][bufferId];
    }

    private async loadBufferView(bufferViewId: number): Promise<ArrayBuffer> {
        if (!this._content.bufferViews) throw new Error('BufferViews not available.')
        if (!this._content.bufferViews[bufferViewId]) throw new Error('BufferView not available.')
        const bufferView = this._content.bufferViews[bufferViewId];
        if (this._loaded['bufferView'] && this._loaded['bufferView'][bufferViewId]) return this._loaded['bufferView'][bufferViewId];

        const byteLength = bufferView.byteLength || 0;
        const byteOffset = bufferView.byteOffset || 0;

        if (bufferView.buffer === undefined) throw new Error('BufferView has no buffer defined.')
        const buffer = await this.loadBuffer(bufferView.buffer!);
        const result = buffer.slice(byteOffset, byteOffset + byteLength);

        if (!this._loaded['bufferView']) this._loaded['bufferView'] = {};
        this._loaded['bufferView'][bufferViewId] = result;

        // bufferView has a target property that we don't care about as this is JavaScript :)
        return this._loaded['bufferView'][bufferViewId];
    }

    private loadCamera(cameraId: number): TreeNode {
        if (!this._content.cameras) throw new Error('Cameras not available.')
        if (!this._content.cameras[cameraId]) throw new Error('Cameras not available.')
        const cameraDef = this._content.cameras[cameraId];
        const cameraNode = new TreeNode(cameraDef.name || 'camera_' + cameraId);

        if ( cameraDef.type === 'perspective' ) {
            const perspectiveCameraDef = cameraDef.perspective!;
            const cameraData = new PerspectiveCameraData(cameraNode, cameraNode.id);
            cameraNode.data.push(cameraData);
            cameraData.fov = perspectiveCameraDef.yfov * (180 / Math.PI);
            cameraData.aspect = perspectiveCameraDef.aspectRatio || 1;
            cameraData.near = perspectiveCameraDef.znear || 1;
            cameraData.far = perspectiveCameraDef.zfar || 2e6;
		} else if ( cameraDef.type === 'orthographic' ) {
            const orthographicCameraDef = cameraDef.orthographic!;
            const cameraData = new OrthographicCameraData(cameraNode, cameraNode.id);
            cameraNode.data.push(cameraData);
            cameraData.left = -orthographicCameraDef.xmag;
            cameraData.right = orthographicCameraDef.xmag;
            cameraData.top = -orthographicCameraDef.ymag;
            cameraData.bottom = orthographicCameraDef.ymag;
            cameraData.near = orthographicCameraDef.znear || 1;
            cameraData.far = orthographicCameraDef.zfar || 2e6;
		}
        return cameraNode;
    }

    private async loadMap(textureId: number): Promise<MapData> {
        if (!this._content.textures) throw new Error('Textures not available.')
        const texture = this._content.textures[textureId];
        if (this._loaded['texture'] && this._loaded['texture'][textureId]) return this._loaded['texture'][textureId].clone();
        if (!this._content.images) throw new Error('Images not available.')
        const image = this._content.images[texture.source];
        const sampler = this._content.samplers && texture.sampler && this._content.samplers[texture.sampler] ? this._content.samplers[texture.sampler] : {};

        const DATA_URI_REGEX = /^data:(.*?)(;base64)?,(.*)$/;
        const HTTPS_URI_REGEX = /^https:\/\//;

        let mapData: MapData;
        if (image.bufferView !== undefined) {
            const bufferView = await this.loadBufferView(image.bufferView);
            const dataView = new DataView(bufferView);
            const array: Array<number> = [];
            for (let i = 0; i < dataView.byteLength; i += 1)
                array[i] = dataView.getUint8(i);

            const blob = new Blob([new Uint8Array(array)], { type: image.mimeType });
            const dataUri = window.URL.createObjectURL(blob);
            mapData = new MapData(await this._converter.responseToImage(await this._loadData!(dataUri)), sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter, undefined, undefined, undefined, undefined, undefined, false);
        } else {
            const url = DATA_URI_REGEX.test(image.uri!) || HTTPS_URI_REGEX.test(image.uri!) ? image.uri : `${this._baseUri}/${image.uri}`;
            mapData = new MapData(await this._converter.responseToImage(await this._loadData!(url!)), sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter, undefined, undefined, undefined, undefined, undefined, false);
        }

        if (!this._loaded['texture']) this._loaded['texture'] = {};
        this._loaded['texture'][textureId] = mapData;
        return this._loaded['texture'][textureId].clone();
    }

    private async loadMaterial(materialId: number): Promise<MaterialData> {
        if (!this._content.materials) throw new Error('Materials not available.')
        const material: IGLTF_v2_Material = this._content.materials[materialId];

        const materialData = new MaterialData();
        if (material.name !== undefined) materialData.name = material.name;

        if (material.extensions && material.extensions.SHAPEDIVER_materials_preset) {
            const materialPreset: ISHAPEDIVER_materials_preset = material.extensions.SHAPEDIVER_materials_preset;
            await this._materialEngine.loadPresetMaterial(materialPreset.materialpreset, materialData);
            materialData.color = this._converter.toColor(materialPreset.color);
            return materialData;
        }

        if (material.extensions && material.extensions.KHR_materials_pbrSpecularGlossiness) {
            const pbrSpecularGlossiness: IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness = material.extensions.KHR_materials_pbrSpecularGlossiness;
            materialData.KHR_materials_pbrSpecularGlossiness = true;
            materialData.color = '#ffffff';
            materialData.opacity = 1.0;

            if (pbrSpecularGlossiness.diffuseFactor !== undefined) {
                materialData.color = this._converter.toColor([pbrSpecularGlossiness.diffuseFactor[0] * 255, pbrSpecularGlossiness.diffuseFactor[1] * 255, pbrSpecularGlossiness.diffuseFactor[2] * 255]);
                materialData.opacity = pbrSpecularGlossiness.diffuseFactor[3];
            }

            if (pbrSpecularGlossiness.diffuseTexture !== undefined)
                materialData.map = await this.loadMap(pbrSpecularGlossiness.diffuseTexture.index);

            materialData.emissiveness = '#000000';
            materialData.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
            materialData.specular = '#ffffff';

            if (pbrSpecularGlossiness.specularFactor !== undefined) {
                materialData.specular = this._converter.toColor([pbrSpecularGlossiness.specularFactor[0] * 255, pbrSpecularGlossiness.specularFactor[1] * 255, pbrSpecularGlossiness.specularFactor[2] * 255]);
            }

            if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
                materialData.specularGlossinessMap = await this.loadMap(pbrSpecularGlossiness.specularGlossinessTexture.index);
            }
        } else if (material.extensions && material.extensions.KHR_materials_unlit) {
            materialData.KHR_materials_unlit = true;
            materialData.color = '#ffffff';
            materialData.opacity = 1.0;

            if (material.pbrMetallicRoughness !== undefined) {
                if (material.pbrMetallicRoughness.baseColorFactor !== undefined) {
                    materialData.color = this._converter.toColor([material.pbrMetallicRoughness.baseColorFactor[0] * 255, material.pbrMetallicRoughness.baseColorFactor[1] * 255, material.pbrMetallicRoughness.baseColorFactor[2] * 255]);
                    materialData.opacity = material.pbrMetallicRoughness.baseColorFactor[3];
                }
                if (material.pbrMetallicRoughness.baseColorTexture !== undefined) {
                    materialData.map = await this.loadMap(material.pbrMetallicRoughness.baseColorTexture.index);
                }
            }
        } else {
            if (material.pbrMetallicRoughness !== undefined) {
                materialData.color = '#ffffff';
                if (material.pbrMetallicRoughness.baseColorFactor !== undefined) {
                    materialData.color = this._converter.toColor([material.pbrMetallicRoughness.baseColorFactor[0] * 255, material.pbrMetallicRoughness.baseColorFactor[1] * 255, material.pbrMetallicRoughness.baseColorFactor[2] * 255]);
                    materialData.opacity = material.pbrMetallicRoughness.baseColorFactor[3];
                }
                if (material.pbrMetallicRoughness.baseColorTexture !== undefined) {
                    materialData.map = await this.loadMap(material.pbrMetallicRoughness.baseColorTexture.index);
                }
                if (material.pbrMetallicRoughness.metallicFactor !== undefined) {
                    materialData.metalness = material.pbrMetallicRoughness.metallicFactor;
                }
                if (material.pbrMetallicRoughness.roughnessFactor !== undefined) {
                    materialData.roughness = material.pbrMetallicRoughness.roughnessFactor;
                }
                if (material.pbrMetallicRoughness.metallicRoughnessTexture !== undefined) {
                    materialData.metalnessRoughnessMap = await this.loadMap(material.pbrMetallicRoughness.metallicRoughnessTexture.index);
                }
            }
        }

        if (material.normalTexture !== undefined) {
            materialData.normalMap = await this.loadMap(material.normalTexture.index);
            materialData.normalScale = 1;
            if (material.normalTexture.scale !== undefined) {
                materialData.normalScale = material.normalTexture.scale;
            }
        }
        if (material.occlusionTexture !== undefined) {
            materialData.aoMap = await this.loadMap(material.occlusionTexture.index);
            if (material.occlusionTexture.strength !== undefined) {
                materialData.aoMapIntensity = material.occlusionTexture.strength;
            }
        }
        if (material.emissiveTexture !== undefined) {
            materialData.emissiveMap = await this.loadMap(material.emissiveTexture.index);
        }

        if (material.emissiveFactor !== undefined) {
            materialData.emissiveness = this._converter.toColor([material.emissiveFactor[0] * 255, material.emissiveFactor[1] * 255, material.emissiveFactor[2] * 255]);
        }
        if (material.alphaMode !== undefined) {
            materialData.alphaMode = material.alphaMode.toLowerCase() === MATERIAL_ALPHA.MASK ? MATERIAL_ALPHA.MASK : material.alphaMode.toLowerCase() === MATERIAL_ALPHA.BLEND ? MATERIAL_ALPHA.BLEND : MATERIAL_ALPHA.OPAQUE;
            if (materialData.alphaMode === MATERIAL_ALPHA.MASK) {
                materialData.alphaCutoff = material.alphaCutoff !== undefined ? material.alphaCutoff : 0.5;
            }
        }
        if (material.alphaCutoff !== undefined) {
            materialData.alphaCutoff = material.alphaCutoff;
        }
        if (material.doubleSided !== undefined) {
            materialData.side = material.doubleSided ? MATERIAL_SIDE.DOUBLE : MATERIAL_SIDE.FRONT;
        }

        return materialData
    }

    private async loadMesh(meshId: number, weights?: number[]): Promise<TreeNode> {
        if (!this._content.meshes) throw new Error('Meshes not available.')
        if (!this._content.meshes[meshId]) throw new Error('Mesh not available.')
        const mesh = this._content.meshes[meshId];
        const meshNode = new TreeNode(mesh.name || 'mesh_' + meshId);

        if (mesh.primitives)
            for (let i = 0, len = mesh.primitives.length; i < len; i++)
                meshNode.addChild(await this.loadPrimitive(mesh.primitives, i, mesh.weights || weights));

        return meshNode;
    }

    private async loadNode(nodeId: number): Promise<TreeNode> {
        if (!this._content.nodes) throw new Error('Nodes not available.')
        if (!this._content.nodes[nodeId]) throw new Error('Node not available.')
        const node = this._content.nodes[nodeId];
        const nodeDef = new TreeNode(node.name || 'node_' + nodeId);
        this._nodes[nodeId] = nodeDef;

        if (node.matrix) {
            nodeDef.transformations.push({
                id: 'gltf_matrix',
                matrix: mat4.fromValues(node.matrix[0], node.matrix[1], node.matrix[2], node.matrix[3],
                    node.matrix[4], node.matrix[5], node.matrix[6], node.matrix[7],
                    node.matrix[8], node.matrix[9], node.matrix[10], node.matrix[11],
                    node.matrix[12], node.matrix[13], node.matrix[14], node.matrix[15])
            });
        } else if (node.translation || node.scale || node.rotation) {
            const matT = node.translation ? mat4.fromTranslation(mat4.create(), vec3.fromValues(node.translation[0], node.translation[1], node.translation[2])) : mat4.create();
            const matS = node.scale ? mat4.fromScaling(mat4.create(), vec3.fromValues(node.scale[0], node.scale[1], node.scale[2])) : mat4.create();
            const matR = node.rotation ? mat4.fromQuat(mat4.create(), vec4.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])) : mat4.create();
            
            nodeDef.transformations.push({
                id: 'gltf_matrix_translation',
                matrix: matT
            });
            nodeDef.transformations.push({
                id: 'gltf_matrix_scale',
                matrix: matS
            });
            nodeDef.transformations.push({
                id: 'gltf_matrix_rotation',
                matrix: matR
            });
        }

        if (node.mesh !== undefined)
            nodeDef.addChild(await this.loadMesh(node.mesh, node.weights));

        if (node.camera !== undefined)
            nodeDef.addChild(this.loadCamera(node.camera));

        if (node.children) {
            for (let i = 0, len = node.children.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadNode(node.children[i]));
            }
        }

        return nodeDef;
    }

    private async loadPrimitive(primitives: IGLTF_v2_Primitive[], index: number, weights: number[] = []): Promise<TreeNode> {
        const primitive = primitives[index];
        const primitiveNode = new TreeNode('primitive_' + index);

        const attributes: {
            [key: string]: AttributeData
        } = {};

        const convertedNames: { [key: string]: string } = {}
        for (let attribute in primitive.attributes) {
            let attributeName = attribute;
            // attribute name conversion to be consistent with gltf
            if (/\d/.test(attributeName) && !attributeName.includes('_')) {
                const index = attributeName.search(/\d/)
                attributeName = attributeName.substring(0, index) + '_' + attributeName.substring(index, attributeName.length);
            } else if (attributeName === 'TEXCOORD' || attributeName === 'COLOR' || attributeName === 'JOINTS' || attributeName === 'WEIGHTS') {
                attributeName += '_0';
            } else if (attributeName === 'UV') {
                attributeName = 'TEXCOORD_0';
            }

            convertedNames[attribute] = attributeName;
            attributes[attributeName] = (await this.loadAccessor(primitive.attributes[attribute]))!;
        }

        // reading and assigning morph targets
        if (primitive.targets) {
            for (let i = 0; i < primitive.targets.length; i++) {
                for (let target in primitive.targets[i]) {
                    if (!attributes[target]) continue;
                    attributes[convertedNames[target]].morphAttributeData.push((await this.loadAccessor(primitive.targets[i][target]))!);
                }
            }
        }

        let indices = null;
        if (primitive.indices || primitive.indices === 0)
            indices = await this.loadAccessor(primitive.indices);

        let material = null;
        if (primitive.material || primitive.material === 0)
            material = await this.loadMaterial(primitive.material);

        const geometryData = new GeometryData(new PrimitiveData(attributes, primitive.mode, indices, material));
        geometryData.morphWeights = weights;
        primitiveNode.data.push(geometryData);
        return primitiveNode;
    }

    private async loadScene(): Promise<TreeNode> {
        if (!this._content.scenes) throw new Error('Scenes not available.')
        const sceneID = this._content.scene || 0;
        if (!this._content.scenes[sceneID]) throw new Error('Scene not available.')
        const scene = this._content.scenes[sceneID];
        const sceneDef = new TreeNode(scene.name || 'scene_' + sceneID + '');
        sceneDef.transformations.push({
            id: this._uuidGenerator.create(),
            matrix: this._globalTransformation
        })
        if (scene.nodes)
            for (let i = 0, len = scene.nodes.length; i < len; i++)
                sceneDef.addChild(await this.loadNode(scene.nodes[i]));
        return sceneDef;
    }

    private async loadSkin(skinId: number): Promise<{
        joints: number[],
        inverseBindMatrices: AttributeData | null
    }> {
        if (!this._content.skins) throw new Error('Skins not available.')
        if (!this._content.skins[skinId]) throw new Error('Skin not available.')
        const skinDef = this._content.skins![skinId];

        const skinEntry: {
            joints: number[],
            inverseBindMatrices: AttributeData | null
        } = {
            joints: skinDef.joints,
            inverseBindMatrices: null
        };

        if (skinDef.inverseBindMatrices === undefined) {
            return skinEntry;
        }

        skinEntry.inverseBindMatrices = await this.loadAccessor(skinDef.inverseBindMatrices)
        return skinEntry;
    }

    private validateVersionAndExtensions(): void {
        if (!this._content.asset) throw new Error('Asset not available.')
        const asset = this._content.asset;
        if (!asset.version) throw new Error('Asset does not have a version.')
        const version: string = asset.minVersion ? asset.minVersion : asset.version;
        if (!version.startsWith('2')) throw new Error('Version of the glTF not supported.');

        if (this._content.extensionsUsed) {
            const notSupported = [];
            for (let i = 0; i < this._content.extensionsUsed.length; i++) {
                if (!(<string[]>Object.values(GLTF_EXTENSIONS)).includes(this._content.extensionsUsed[i]))
                    notSupported.push(this._content.extensionsUsed[i]);
            }
            if (notSupported.length > 0) {
                let message = 'Extension' + (notSupported.length === 1 ? ' ' : 's ');
                notSupported.forEach((element, index) => {
                    message += '"' + element + '"' + (index === notSupported.length - 1 ? '' : index === notSupported.length - 2 ? ' and ' : ', ');
                });
                message += (notSupported.length === 1 ? ' is' : ' are') + ' not supported, but used. Loading glTF regardless.';
                this._logger.info(LOGGINGTOPIC.DATA_PROCESSING, 'GLTFLoader.validateVersionAndExtensions: ' + message);
            }
        }

        if (this._content.extensionsRequired) {
            const notSupported = [];
            for (let i = 0; i < this._content.extensionsRequired.length; i++) {
                if (!(<string[]>Object.values(GLTF_EXTENSIONS)).includes(this._content.extensionsRequired[i]))
                    notSupported.push(this._content.extensionsRequired[i]);
            }
            if (notSupported.length > 0) {
                let message = 'Extension' + (notSupported.length === 1 ? ' ' : 's ');
                notSupported.forEach((element, index) => {
                    message += '"' + element + '"' + (index === notSupported.length - 1 ? '' : index === notSupported.length - 2 ? ' and ' : ', ');
                });
                message += (notSupported.length === 1 ? ' is' : ' are') + ' not supported, but required. Aborting glTF loading.';
                throw new Error(message);
            }
        }
    }

    // #endregion Private Methods (13)
}