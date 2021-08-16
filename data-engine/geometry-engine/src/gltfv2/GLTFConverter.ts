import { build_data } from '@shapediver/viewer.shared.build-data'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Converter, HttpClient, ImageLoader, SDError, UuidGenerator } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'
import {
    ACCESSORCOMPONENTTYPE_V2 as ACCESSOR_COMPONENTTYPE,
    ACCESSORTYPE_V2 as ACCESSORTYPE,
    IGLTF_v2,
    IGLTF_v2_Scene,
    IGLTF_v2_Node,
    IGLTF_v2_Material,
    IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness,
    IGLTF_v2_Primitive,
    IGLTF_v2_Mesh,
    IGLTF_v2_Accessor,
    ACCESSORCOMPONENTSIZE_V2,
    IGLTF_v2_BufferView,
    IGLTF_v2_Buffer,
    IGLTF_v2_Texture,
    IGLTF_v2_Image,
} from '@shapediver/viewer.data-engine.shared-types'
import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
import {
    AttributeData,
    GeometryData,
    MapData,
    MATERIAL_ALPHA,
    MATERIAL_SIDE,
    MaterialData,
    PrimitiveData,
} from '@shapediver/viewer.shared.types'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'

export enum GLTF_EXTENSIONS {
    KHR_BINARY_GLTF = 'KHR_binary_glTF',
    KHR_MATERIALS_PBRSPECULARGLOSSINESS = 'KHR_materials_pbrSpecularGlossiness',
    KHR_MATERIALS_UNLIT = 'KHR_materials_unlit',
}
export class GLTFConverter {
    // #region Properties (17)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _globalTransformation = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        0, 0, 0, 1);
    private readonly _globalTransformationInverse = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _imageLoader: ImageLoader = <ImageLoader>container.resolve(ImageLoader);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _baseUri!: string;
    private _body!: ArrayBuffer;
    private _buffers: ArrayBuffer[] = [];
    private _byteOffset: number = 0;
    private _content: IGLTF_v2 = {
        asset: {
            copyright: '2021 (c) ShapeDiver', // TODO
            generator: 'ShapeDiverViewer@' + build_data.build_version,
            version: '2.0',
            extensions: {}
        },
    }

    private _extensionsRequired: string[] = [];
    private _extensionsUsed: string[] = [];
    private _imageCache: { [key: string]: number } = {};
    private _loaded: {
        [key: string]: {
            [key: string]: any
        }
    } = {};

    // #endregion Properties (17)

    // #region Public Methods (1)

    public async convert(node: TreeNode): Promise<IGLTF_v2 | string | ArrayBuffer | null> {
        const sceneDef: IGLTF_v2_Scene = {
            name: node.name,
        };

        if (node.children.length > 0) sceneDef.nodes = [];
        for (let i = 0; i < node.children.length; i++) {
            const nodeId = this.convertNode(node.children[i]);
            this._content.nodes![nodeId].matrix = [this._globalTransformationInverse[0], this._globalTransformationInverse[1], this._globalTransformationInverse[2], this._globalTransformationInverse[3],
            this._globalTransformationInverse[4], this._globalTransformationInverse[5], this._globalTransformationInverse[6], this._globalTransformationInverse[7],
            this._globalTransformationInverse[8], this._globalTransformationInverse[9], this._globalTransformationInverse[10], this._globalTransformationInverse[11],
            this._globalTransformationInverse[12], this._globalTransformationInverse[13], this._globalTransformationInverse[14], this._globalTransformationInverse[15]];
            sceneDef.nodes?.push(nodeId);
        }
        this._content.scenes = [];
        this._content.scenes.push(sceneDef);

        // Declare extensions.
        const extensionsUsedList = Object.keys(this._extensionsUsed);
        if (extensionsUsedList.length > 0) this._content.extensionsUsed = extensionsUsedList;
        const extensionsRequiredList = Object.keys(this._extensionsRequired);
        if (extensionsRequiredList.length > 0) this._content.extensionsRequired = extensionsRequiredList;

        // Merge buffers.
        const blob = new Blob(this._buffers, { type: 'application/octet-stream' });

        // Update bytelength of the single buffer.
        if (this._content.buffers && this._content.buffers.length > 0) this._content.buffers[0].byteLength = blob.size;

        return new Promise<IGLTF_v2 | string | ArrayBuffer | null>(resolve => {
            // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification

            const reader = new window.FileReader();
            reader.readAsArrayBuffer(blob);
            reader.onloadend = () => {
                // Binary chunk.
                const binaryChunk = this.getPaddedArrayBuffer(<ArrayBuffer>reader.result);
                const binaryChunkPrefix = new DataView(new ArrayBuffer(8));
                binaryChunkPrefix.setUint32(0, binaryChunk.byteLength, true);
                binaryChunkPrefix.setUint32(4, 0x004E4942, true);

                // JSON chunk.
                const jsonChunk = this.getPaddedArrayBuffer(this.stringToArrayBuffer(JSON.stringify(this._content)), 0x20);
                const jsonChunkPrefix = new DataView(new ArrayBuffer(8));
                jsonChunkPrefix.setUint32(0, jsonChunk.byteLength, true);
                jsonChunkPrefix.setUint32(4, 0x4E4F534A, true);

                // GLB header.
                const header = new ArrayBuffer(12);
                const headerView = new DataView(header);
                headerView.setUint32(0, 0x46546C67, true);
                headerView.setUint32(4, 2, true);
                const totalByteLength = 12
                    + jsonChunkPrefix.byteLength + jsonChunk.byteLength
                    + binaryChunkPrefix.byteLength + binaryChunk.byteLength;
                headerView.setUint32(8, totalByteLength, true);

                const glbBlob = new Blob([
                    header,
                    jsonChunkPrefix,
                    jsonChunk,
                    binaryChunkPrefix,
                    binaryChunk
                ], { type: 'application/octet-stream' });

                const glbReader = new window.FileReader();
                glbReader.readAsArrayBuffer(glbBlob);
                glbReader.onloadend = () => {
                    resolve(glbReader.result);
                };

            };
        })
    }

    // #endregion Public Methods (1)

    // #region Private Methods (14)

    private convertAccessor(data: AttributeData): number {
        if (!this._content.accessors) this._content.accessors = [];

        const bufferView = this.convertBufferView(data);
        const minMax = this.getMinMax(data);

        const accessorDef: IGLTF_v2_Accessor = {
            bufferView: bufferView,
            byteOffset: 0,
            componentType: this.getComponentType(data.array),
            normalized: data.normalized,
            count: +data.count,
            max: minMax.max,
            min: minMax.min,
            type: this.getType(data.itemSize),
            // sparse: { // TODO
            //     count: number,
            //     indices: {
            //         bufferView: number,
            //         byteOffset?: number,
            //         componentType: number,
            //         extensions?: { [id: string]: any },
            //         extras?: any
            //     },
            //     values: {
            //         bufferView: number,
            //         byteOffset?: number,
            //         extensions?: { [id: string]: any },
            //         extras?: any
            //     },
            //     extensions?: { [id: string]: any },
            //     extras?: any
            // },
        };

        this._content.accessors.push(accessorDef);
        return this._content.accessors.length - 1;
    }

    private convertBuffer(buffer: ArrayBuffer): number {
        if (!this._content.buffers) this._content.buffers = [];
        if (this._content.buffers.length === 0) this._content.buffers = [{ byteLength: 0 }];
        this._buffers.push(buffer);
        return 0;
    }

    private convertBufferView(data: AttributeData): number {
        if (!this._content.bufferViews) this._content.bufferViews = [];
        let componentTypeNumber = this.getComponentType(data.array)
        let componentSize = ACCESSORCOMPONENTSIZE_V2[<keyof typeof ACCESSORCOMPONENTSIZE_V2>componentTypeNumber];

        const byteLength = Math.ceil(data.count * data.itemSize * componentSize / 4) * 4;
        const dataView = new DataView(new ArrayBuffer(byteLength));
        let offset = 0;

        for (let i = 0; i < data.count; i++) {
            for (let a = 0; a < data.itemSize; a++) {
                let value = 0;
                if (data.itemSize > 4) {
                    // no support for interleaved data for itemSize > 4
                    value = data.array[i * data.itemSize + a];
                } else {
                    if (a === 0) value = data.array[i * data.itemSize];
                    else if (a === 1) value = data.array[i * data.itemSize + 1];
                    else if (a === 2) value = data.array[i * data.itemSize + 2];
                    else if (a === 3) value = data.array[i * data.itemSize + 3];
                }

                if (data.array instanceof Float32Array) {
                    dataView.setFloat32(offset, value, true);
                } else if (data.array instanceof Uint32Array) {
                    dataView.setUint32(offset, value, true);
                } else if (data.array instanceof Uint16Array) {
                    dataView.setUint16(offset, value, true);
                } else if (data.array instanceof Int16Array) {
                    dataView.setInt16(offset, value, true);
                } else if (data.array instanceof Uint8Array) {
                    dataView.setUint8(offset, value);
                } else if (data.array instanceof Int8Array) {
                    dataView.setInt8(offset, value);
                }
                offset += componentSize;
            }
        }

        const bufferViewDef: IGLTF_v2_BufferView = {
            buffer: this.convertBuffer(dataView.buffer),
            byteOffset: this._byteOffset,
            byteLength: byteLength
        };
        this._byteOffset += byteLength;

        this._content.bufferViews.push(bufferViewDef);
        return this._content.bufferViews.length - 1;
    }

    private convertImage(data: MapData): number {
        if (!this._content.images) this._content.images = [];
        if (this._imageCache[data.image.src]) return this._imageCache[data.image.src];
        const imageDef: IGLTF_v2_Image = {
            uri: data.image.src
        };
        this._content.images.push(imageDef);
        this._imageCache[data.image.src] = this._content.images.length - 1;
        return this._content.images.length - 1;
    }

    private convertMaterial(data: MaterialData): number {
        if (!this._content.materials) this._content.materials = [];
        const materialDef: IGLTF_v2_Material = {
            name: data.id,
            pbrMetallicRoughness: {}
        };

        if (data.KHR_materials_pbrSpecularGlossiness) {
            if (!this._extensionsUsed.includes('KHR_materials_pbrSpecularGlossiness'))
                this._extensionsUsed.push('KHR_materials_pbrSpecularGlossiness')
            if (!this._extensionsRequired.includes('KHR_materials_pbrSpecularGlossiness'))
                this._extensionsRequired.push('KHR_materials_pbrSpecularGlossiness')

            const ext: IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness = {};

            ext.diffuseFactor = this._converter.toColorArray(data.color);
            ext.diffuseFactor[3] = data.opacity;
            if (data.map) ext.diffuseTexture = { index: this.convertTexture(data.map) }
            ext.specularFactor = this._converter.toColorArray(data.specular);
            ext.glossinessFactor = data.glossiness;
            if (data.specularGlossinessMap)
                ext.specularGlossinessTexture = { index: this.convertTexture(data.specularGlossinessMap) };

            materialDef.extensions = {
                KHR_materials_pbrSpecularGlossiness: ext
            }
        } else if (data.KHR_materials_unlit) {
            if (!this._extensionsUsed.includes('KHR_materials_unlit'))
                this._extensionsUsed.push('KHR_materials_unlit')
            if (!this._extensionsRequired.includes('KHR_materials_unlit'))
                this._extensionsRequired.push('KHR_materials_unlit')
            materialDef.pbrMetallicRoughness!.baseColorFactor = this._converter.toColorArray(data.color);
            materialDef.pbrMetallicRoughness!.baseColorFactor[3] = data.opacity;
            if (data.map) materialDef.pbrMetallicRoughness!.baseColorTexture = { index: this.convertTexture(data.map) }

            materialDef.extensions = {
                KHR_materials_unlit: {}
            };
        } else {
            materialDef.pbrMetallicRoughness!.baseColorFactor = this._converter.toColorArray(data.color);
            materialDef.pbrMetallicRoughness!.baseColorFactor[3] = data.opacity;
            if (data.map) materialDef.pbrMetallicRoughness!.baseColorTexture = { index: this.convertTexture(data.map) }
            materialDef.pbrMetallicRoughness!.metallicFactor = data.metalness;
            materialDef.pbrMetallicRoughness!.roughnessFactor = data.roughness;
            if (data.metalnessRoughnessMap) {
                materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: this.convertTexture(data.metalnessRoughnessMap) };
            } else if (data.metalnessMap || data.roughnessMap) {
                const map: MapData = (data.metalnessMap || data.roughnessMap)!;
                const combinedImage = this._converter.combineImages(undefined, data.roughnessMap?.image, data.metalnessMap?.image);
                materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: this.convertTexture(new MapData(combinedImage, map.wrapS, map.wrapT, map.minFilter, map.magFilter, map.center, map.color, map.offset, map.repeat, map.rotation, map.flipY)) };
            }
        }

        if (data.normalMap) materialDef.normalTexture = { index: this.convertTexture(data.normalMap) };
        if (data.aoMap) materialDef.occlusionTexture = { index: this.convertTexture(data.aoMap) };
        if (data.emissiveMap) materialDef.emissiveTexture = { index: this.convertTexture(data.emissiveMap) };
        if (data.emissiveness) materialDef.emissiveFactor = this._converter.toColorArray(data.emissiveness);
        materialDef.alphaMode = data.alphaMode.toUpperCase();
        if (data.alphaMode === MATERIAL_ALPHA.MASK) materialDef.alphaCutoff = data.alphaCutoff;
        materialDef.doubleSided = data.side === MATERIAL_SIDE.DOUBLE;

        this._content.materials.push(materialDef);
        return this._content.materials.length - 1;
    }

    private convertMesh(data: GeometryData): number {
        if (!this._content.meshes) this._content.meshes = [];
        const meshDef: IGLTF_v2_Mesh = {
            primitives: [],
            name: data.id
        };

        meshDef.primitives?.push(this.convertPrimitive(data.primitive))

        this._content.meshes.push(meshDef);
        return this._content.meshes.length - 1;
    }

    private convertNode(node: TreeNode): number {
        if (!this._content.nodes) this._content.nodes = [];
        const nodeDef: IGLTF_v2_Node = {
            name: node.name,
        };

        if (node.transformations.length > 0)
            nodeDef.matrix = [node.nodeMatrix[0], node.nodeMatrix[1], node.nodeMatrix[2], node.nodeMatrix[3],
            node.nodeMatrix[4], node.nodeMatrix[5], node.nodeMatrix[6], node.nodeMatrix[7],
            node.nodeMatrix[8], node.nodeMatrix[9], node.nodeMatrix[10], node.nodeMatrix[11],
            node.nodeMatrix[12], node.nodeMatrix[13], node.nodeMatrix[14], node.nodeMatrix[15]];

        for (let i = 0; i < node.data.length; i++)
            if (node.data[i] instanceof GeometryData)
                nodeDef.mesh = this.convertMesh(<GeometryData>node.data[i])

        if (node.children.length > 0) nodeDef.children = [];
        for (let i = 0; i < node.children.length; i++)
            nodeDef.children?.push(this.convertNode(node.children[i]));

        this._content.nodes.push(nodeDef);
        return this._content.nodes.length - 1;
    }

    private convertPrimitive(data: PrimitiveData): IGLTF_v2_Primitive {
        const primitiveDef: IGLTF_v2_Primitive = {
            attributes: {},
            mode: data.mode
        };

        for (let a in data.attributes)
            primitiveDef.attributes[a] = this.convertAccessor(data.attributes[a])

        if (data.indices)
            primitiveDef.indices = this.convertAccessor(data.indices);

        if (data.material)
            primitiveDef.material = this.convertMaterial(data.material);

        return primitiveDef;
    }

    private convertTexture(data: MapData): number {
        if (!this._content.textures) this._content.textures = [];
        const textureDef: IGLTF_v2_Texture = {
            source: this.convertImage(data)
        };
        // TODO samplers
        this._content.textures.push(textureDef);
        return this._content.textures.length - 1;
    }

    private getComponentType(array: Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array) {
        switch (true) {
            case array instanceof Int8Array:
                return 5120;
            case array instanceof Uint8Array:
                return 5121;
            case array instanceof Int16Array:
                return 5122;
            case array instanceof Uint16Array:
                return 5123;
            case array instanceof Uint32Array:
                return 5125;
            default:
                return 5126;
        }
    }

    private getMinMax(data: AttributeData): { min: number[], max: number[] } {
        const output = {
            min: new Array(data.itemSize).fill(Number.POSITIVE_INFINITY),
            max: new Array(data.itemSize).fill(Number.NEGATIVE_INFINITY)
        };

        for (let i = 0; i < data.count; i++) {
            for (let a = 0; a < data.itemSize; a++) {
                let value = 0;
                if (data.itemSize > 4) {
                    // no support for interleaved data for itemSize > 4
                    value = data.array[i * data.itemSize + a];
                } else {
                    if (a === 0) value = data.array[i * data.itemSize];
                    else if (a === 1) value = data.array[i * data.itemSize + 1];
                    else if (a === 2) value = data.array[i * data.itemSize + 2];
                    else if (a === 3) value = data.array[i * data.itemSize + 3];
                }
                output.min[a] = Math.min(output.min[a], value);
                output.max[a] = Math.max(output.max[a], value);
            }
        }
        return output;
    }

    private getPaddedArrayBuffer(arrayBuffer: ArrayBuffer, paddingByte = 0) {
        const paddedLength = Math.ceil(arrayBuffer.byteLength / 4) * 4;

        if (paddedLength !== arrayBuffer.byteLength) {
            const array = new Uint8Array(paddedLength);
            array.set(new Uint8Array(arrayBuffer));

            if (paddingByte !== 0) {
                for (let i = arrayBuffer.byteLength; i < paddedLength; i++) {
                    array[i] = paddingByte;
                }
            }

            return array.buffer;
        }

        return arrayBuffer;
    }

    private getType(itemSize: number) {
        switch (itemSize) {
            case 1:
                return 'SCALAR';
            case 2:
                return 'VEC2';
            case 3:
                return 'VEC3';
            case 4:
                return 'VEC4';
            case 9:
                return 'MAT3';
            case 18:
                return 'MAT4';
            default:
                return 'VEC3';
        }
    }

    private stringToArrayBuffer(text: string) {
        if (window.TextEncoder !== undefined) {
            return new TextEncoder().encode(text).buffer;
        }

        const array = new Uint8Array(new ArrayBuffer(text.length));

        for (let i = 0, il = text.length; i < il; i++) {
            const value = text.charCodeAt(i);

            // Replacing multi-byte character with space(0x20).
            array[i] = value > 0xFF ? 0x20 : value;
        }

        return array.buffer;
    }

    // #endregion Private Methods (14)
}