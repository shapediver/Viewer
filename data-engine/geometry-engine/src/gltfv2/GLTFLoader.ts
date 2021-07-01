import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { Converter, HttpClient, ImageLoader, SDError, UuidGenerator } from '@shapediver/viewer.shared.utils';
import { container } from 'tsyringe';

import { ACCESSORCOMPONENTTYPE_V2 as ACCESSOR_COMPONENTTYPE, ACCESSORTYPE_V2 as ACCESSORTYPE, IGLTF_v2, IGLTF_v2_Material, IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness, IGLTF_v2_Primitive } from '@shapediver/viewer.data-engine.shared-types';
import { mat4, vec2, vec3, vec4 } from 'gl-matrix';
import { AttributeData, GeometryData, MapData, MaterialData, MATERIAL_ALPHA, MATERIAL_SIDE, PrimitiveData } from '@shapediver/viewer.shared.types';
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils';

export class GLTFLoader {
    // #region Properties (6)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;

    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _imageLoader: ImageLoader = <ImageLoader>container.resolve(ImageLoader);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _globalTransformation = mat4.fromValues(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
    private readonly _implementedExtensions = ['KHR_materials_pbrSpecularGlossiness'];
    private readonly _converter: Converter = <Converter>container.resolve(Converter);

    private _baseUri!: string;
    private _body!: ArrayBuffer;
    private _content!: IGLTF_v2;
    private _loaded: {
        [key: string]: {
            [key: string]: any
        }
    } = {};

    // #endregion Properties (6)

    // #region Public Methods (1)

    public async load(url?: string | undefined): Promise<TreeNode> {
        let axiosResponse;

        try {
            axiosResponse = await this._httpClient.get(url!, {
                responseType: 'arraybuffer'
            });
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, new SDError(e.message, e), `GLTFLoader.load: Initial loading of geometry failed.`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError(e.message, e), `GLTFLoader.load: Initial loading of geometry failed.`, false)
            }
            return new TreeNode();
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
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GLTFLoader.load: Invalid data: glTF magic wrong.'));
                return new TreeNode();
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

        console.log(this._content)
        try {
            this.validateVersionAndExtensions();
            return await this.loadScene();
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, e, `GLTFLoader.load: Loading of geometry failed.`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, e, `GLTFLoader.load: Loading of geometry failed.`, false)
            }
            return new TreeNode();
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (9)

    private async loadAccessor(accessorId: number): Promise<AttributeData | null> {
        if (!this._content.accessors![accessorId]) throw new SDError('Accessor not available.')
        const accessor = this._content.accessors![accessorId];
        if (this._loaded['accessor'] && this._loaded['accessor'][accessorId]) return this._loaded['accessor'][accessorId];

        if (accessor.bufferView === undefined) {
            // Ignore empty accessors, which may be used to declare runtime
            // information about attributes coming from another source (e.g. Draco
            // compression extension).
            return Promise.resolve(null);
        }

        const arrayBuffer = await this.loadBufferView(accessor.bufferView!);

        // @ts-ignore
        const itemSize = ACCESSORTYPE[accessor.type!];
        // @ts-ignore
        const ArrayType = ACCESSOR_COMPONENTTYPE[accessor.componentType!];

        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;
        const byteOffset = accessor.byteOffset || 0;
        const byteStride = accessor.bufferView !== undefined ? this._content.bufferViews[accessor.bufferView].byteStride : undefined;
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
            // @ts-ignore
            const IndicesArrayType = ACCESSOR_COMPONENTTYPE[accessor.sparse.indices.componentType];

            const byteOffsetIndices = accessor.sparse.indices.byteOffset || 0;
            const byteOffsetValues = accessor.sparse.values.byteOffset || 0;

            const sparseIndices = new IndicesArrayType(await this.loadBufferView(accessor.sparse.indices.bufferView!), byteOffsetIndices, accessor.sparse.count * itemSizeIndices);
            const sparseValues = new ArrayType(await this.loadBufferView(accessor.sparse.values.bufferView!), byteOffsetValues, accessor.sparse.count * itemSize);

            if (!this._loaded['accessor']) this._loaded['accessor'] = {};
            this._loaded['accessor'][accessorId] = new AttributeData(array, itemSize, itemBytes, byteOffset, elementBytes, normalized, byteStride, true, sparseIndices, sparseValues);
            return this._loaded['accessor'][accessorId];
        }

        if (!this._loaded['accessor']) this._loaded['accessor'] = {};
        this._loaded['accessor'][accessorId] = new AttributeData(array, itemSize, itemBytes, byteOffset, elementBytes, normalized, byteStride);
        return this._loaded['accessor'][accessorId];
    }

    private async loadBuffer(bufferId: number): Promise<ArrayBuffer> {
        if (!this._content.buffers![bufferId]) throw new SDError('Buffer not available.')
        const buffer = this._content.buffers![bufferId];
        if (this._loaded['buffer'] && this._loaded['buffer'][bufferId]) return this._loaded['buffer'][bufferId];

        if (buffer.type && buffer.type !== 'arraybuffer') {
            throw new SDError(`GLTFLoader.loadBuffer: ${buffer.type} is not supported.`);
        }

        // If present, GLB container is required to be the first buffer.
        if (buffer.uri === undefined && bufferId === 0) {
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
        if (!this._content.bufferViews![bufferViewId]) throw new SDError('Buffer View not available.')
        const bufferView = this._content.bufferViews![bufferViewId];
        if (this._loaded['bufferView'] && this._loaded['bufferView'][bufferViewId]) return this._loaded['bufferView'][bufferViewId];

        const byteLength = bufferView.byteLength || 0;
        const byteOffset = bufferView.byteOffset || 0;
        const buffer = await this.loadBuffer(bufferView.buffer!);
        const result = buffer.slice(byteOffset, byteOffset + byteLength);

        if (!this._loaded['bufferView']) this._loaded['bufferView'] = {};
        this._loaded['bufferView'][bufferViewId] = result;
        return this._loaded['bufferView'][bufferViewId];
    }

    private async loadMap(textureId: number): Promise<MapData> {
        const texture = this._content.textures[textureId];
        if (this._loaded['texture'] && this._loaded['texture'][textureId]) return this._loaded['texture'][textureId].clone();
        const image = this._content.images[texture.source];
        const sampler = this._content.samplers && this._content.samplers[texture.source] ? this._content.samplers[texture.source] : {};

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
            mapData = new MapData(await this._imageLoader.load(dataUri!), sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter, undefined, undefined, undefined, undefined, undefined, false);
        } else {
            const url = DATA_URI_REGEX.test(image.uri!) || HTTPS_URI_REGEX.test(image.uri!) ? image.uri : `${this._baseUri}/${image.uri}`;
            mapData = new MapData(await this._imageLoader.load(url!), sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter, undefined, undefined, undefined, undefined, undefined, false);
        }

        if (!this._loaded['texture']) this._loaded['texture'] = {};
        this._loaded['texture'][textureId] = mapData;
        return this._loaded['texture'][textureId].clone();
    }

    private async loadMaterial(materialId: number): Promise<MaterialData> {
        const material: IGLTF_v2_Material = this._content.materials[materialId];

        const materialData = new MaterialData();
        if (material.name !== undefined) materialData.name = material.name;
        
        if (material.extensions && material.extensions.KHR_materials_pbrSpecularGlossiness) {
            const pbrSpecularGlossiness: IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness = material.extensions.KHR_materials_pbrSpecularGlossiness;
            materialData.specularGlossinessWorkflow = true;
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
        }

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

    private async loadMesh(meshId: number): Promise<TreeNode> {
        if (!this._content.meshes || !this._content.meshes[meshId]) throw new SDError('Mesh not available.')
        const mesh = this._content.meshes[meshId];
        const meshNode = new TreeNode(mesh.name || 'mesh_' + meshId);

        if (mesh.primitives)
            for (let i = 0, len = mesh.primitives.length; i < len; i++)
                meshNode.addChild(await this.loadPrimitive(mesh.primitives, i));

        // weights https://shapediver.atlassian.net/browse/SS-2944
        return meshNode;
    }

    private async loadNode(nodeId: number): Promise<TreeNode> {
        if (!this._content.nodes || !this._content.nodes[nodeId]) throw new SDError('Node not available.')
        const node = this._content.nodes[nodeId];
        const nodeDef = new TreeNode(node.name || 'node_' + nodeId);

        if (node.matrix) {
            nodeDef.transformations.push({
                id: this._uuidGenerator.create(),
                name: 'glTFNode_' + nodeId,
                matrix: mat4.fromValues(node.matrix[0], node.matrix[1], node.matrix[2], node.matrix[3],
                    node.matrix[4], node.matrix[5], node.matrix[6], node.matrix[7],
                    node.matrix[8], node.matrix[9], node.matrix[10], node.matrix[11],
                    node.matrix[12], node.matrix[13], node.matrix[14], node.matrix[15])
            });
        } else if (node.translation || node.scale || node.rotation) {
            const matT = node.translation ? mat4.fromTranslation(mat4.create(), vec3.fromValues(node.translation[0], node.translation[1], node.translation[2])) : mat4.create();
            const matS = node.scale ? mat4.fromScaling(mat4.create(), vec3.fromValues(node.scale[0], node.scale[1], node.scale[2])) : mat4.create();
            const matR = node.rotation ? mat4.fromQuat(mat4.create(), vec4.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])) : mat4.create();
            const matrix = mat4.mul(mat4.create(), mat4.mul(mat4.create(), matT, matS), matR);
            nodeDef.transformations.push({
                id: this._uuidGenerator.create(),
                name: 'glTFNode_' + nodeId,
                matrix: matrix
            });
        }

        if (node.mesh !== undefined)
            nodeDef.addChild(await this.loadMesh(node.mesh));

        if (node.children) {
            for (let i = 0, len = node.children.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadNode(node.children[i]));
            }
        }

        // camera, skin, weights https://shapediver.atlassian.net/browse/SS-2944
        return nodeDef;
    }

    private async loadPrimitive(primitives: IGLTF_v2_Primitive[], index: number): Promise<TreeNode> {
        const primitive = primitives[index];
        const primitiveNode = new TreeNode('primitive_' + index);

        const attributes: {
            [key: string]: AttributeData
        } = {};

        for (let attribute in primitive.attributes)
            attributes[attribute] = (await this.loadAccessor(primitive.attributes[attribute]))!;

        let indices = null;
        if (primitive.indices || primitive.indices === 0)
            indices = await this.loadAccessor(primitive.indices);

        let material = null;
        if (primitive.material || primitive.material === 0)
            material = await this.loadMaterial(primitive.material);

        primitiveNode.data.push(new GeometryData(new PrimitiveData(attributes, primitive.mode, indices, material)));
        // targets https://shapediver.atlassian.net/browse/SS-2944
        return primitiveNode;
    }

    private validateVersionAndExtensions(): void {
        if (!this._content.asset) throw new SDError('Asset not available.')
        const asset = this._content.asset;
        if (!asset.version) throw new SDError('Asset does not have a version.')
        const version: string = asset.minVersion ? asset.minVersion : asset.version;
        if (!version.startsWith('2')) throw new SDError('Version of the glTF not supported.');

        if (this._content.extensionsUsed) {
            const notSupported = [];
            for (let i = 0; i < this._content.extensionsUsed.length; i++) {
                if (!this._implementedExtensions.includes(this._content.extensionsUsed[i]))
                    notSupported.push(this._content.extensionsUsed[i]);
            }
            if (notSupported.length > 0) {
                let message = 'Extension' + (notSupported.length === 1 ? ' ' : 's ');
                notSupported.forEach((element, index) => {
                    message += '"' + element + '"' + (index === notSupported.length - 1 ? '' : index === notSupported.length - 2 ? ' and ' : ', ');
                });
                message += (notSupported.length === 1 ? ' is' : ' are') + ' not supported, but used. Loading glTF regardless.';
                this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'GLTFLoader.validateVersionAndExtensions: ' + message);
            }
        }

        if (this._content.extensionsRequired) {
            const notSupported = [];
            for (let i = 0; i < this._content.extensionsRequired.length; i++) {
                if (!this._implementedExtensions.includes(this._content.extensionsRequired[i]))
                    notSupported.push(this._content.extensionsRequired[i]);
            }
            if (notSupported.length > 0) {
                let message = 'Extension' + (notSupported.length === 1 ? ' ' : 's ');
                notSupported.forEach((element, index) => {
                    message += '"' + element + '"' + (index === notSupported.length - 1 ? '' : index === notSupported.length - 2 ? ' and ' : ', ');
                });
                message += (notSupported.length === 1 ? ' is' : ' are') + ' not supported, but required. Aborting glTF loading.';
                throw new SDError(message);
            }
        }
    }

    private async loadScene(): Promise<TreeNode> {
        const sceneID = this._content.scene || 0;
        if (!this._content.scenes || !this._content.scenes[sceneID]) throw new SDError('Scene not available.')
        const scene = this._content.scenes[sceneID];
        const sceneDef = new TreeNode('scene_' + scene.name || sceneID + '');
        sceneDef.transformations.push({
            id: this._uuidGenerator.create(),
            name: 'glTF_global_transformation',
            matrix: this._globalTransformation
        })
        if (scene.nodes)
            for (let i = 0, len = scene.nodes.length; i < len; i++)
                sceneDef.addChild(await this.loadNode(scene.nodes[i]));
        return sceneDef;
    }

    // #endregion Private Methods (9)
}