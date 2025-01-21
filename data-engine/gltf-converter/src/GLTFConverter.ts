import {
    atobCustom,
    Converter,
    EventEngine,
    EVENTTYPE,
    Logger,
    UuidGenerator
    } from '@shapediver/viewer.shared.services';
import { build_data } from '@shapediver/viewer.shared.build-data';
import { GlobalAccessObjects } from '@shapediver/viewer.shared.global-access-objects';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { mat4, quat, vec3 } from 'gl-matrix';
import {
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
    IGLTF_v2_Texture,
    IGLTF_v2_Image,
    IGLTF_v2_Animation,
} from '@shapediver/viewer.data-engine.shared-types';
import {
    AttributeData,
    GeometryData,
    MapData,
    MATERIAL_ALPHA,
    MATERIAL_SIDE,
    MaterialStandardData,
    AnimationData,
    PRIMITIVE_MODE,
    MaterialSpecularGlossinessData,
    MaterialUnlitData,
    IMaterialAbstractData,
    IMapData,
    IPrimitiveData,
    IAttributeData,
    IAnimationData,
    IGeometryData,
    ITaskEvent,
    TASK_TYPE,
    InstanceData,
} from '@shapediver/viewer.shared.types';

// #region Classes (1)

export class GLTFConverter {
    // #region Properties (23)

    private readonly _converter: Converter = Converter.instance;
    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _globalAccessObjects: GlobalAccessObjects = GlobalAccessObjects.instance;
    private readonly _globalTransformationInverse = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1);
    private readonly _progressUpdateLimit = 500;
    private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

    private static _instance: GLTFConverter;

    private _animations: IAnimationData[] = [];
    private _buffers: ArrayBuffer[] = [];
    private _byteOffset: number = 0;
    private _content: IGLTF_v2 = {
        asset: {
            copyright: '2025 (c) ShapeDiver',
            generator: 'ShapeDiverViewer@' + build_data.build_version,
            version: '2.0',
            extensions: {}
        },
    };
    private _convertForAR = false;
    private _eventId = '';
    private _extensionsRequired: string[] = [];
    private _extensionsUsed: string[] = [];
    private _imageCache: { [key: string]: number } = {};
    private _materialCache: {
        [key: string]: number
    } = {};
    private _meshCache: {
        [key: string]: number
    } = {};
    private _nodes: {
        node: ITreeNode,
        id: number
    }[] = [];
    private _numberOfNodes = 0;
    private _progressTimer = 0;
    private _promises: Promise<unknown>[] = [];
    private _viewport?: string;

    // #endregion Properties (23)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Methods (1)

    public async convert(node: ITreeNode, convertForAR = false, viewport?: string): Promise<ArrayBuffer> {
        this._eventId = this._uuidGenerator.create();
        const eventStart: ITaskEvent = { type: TASK_TYPE.GLTF_CREATION, id: this._eventId, progress: 0, status: 'Starting glTF conversion.' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

        this._numberOfNodes = 0;
        node.traverse(() => this._numberOfNodes++);

        this._progressTimer = performance.now();

        this.reset();

        this._convertForAR = convertForAR;
        this._viewport = viewport;
        const originalParent = node.parent;

        const sceneNode = new TreeNode('ShapeDiverRootNode');
        sceneNode.addChild(node);

        const sceneDef: IGLTF_v2_Scene = {
            name: sceneNode.name,
            nodes: []
        };

        const globalTransformationInverseId = this._uuidGenerator.create();
        node.addTransformation({
            id: globalTransformationInverseId,
            matrix: this._globalTransformationInverse,
        });

        const translationMatrixId = this._uuidGenerator.create();
        if (convertForAR) {
            // add translation matrix to scene tree node
            const center = node.boundingBox.boundingSphere.center;
            const translationMatrix: mat4 = mat4.fromTranslation(mat4.create(), vec3.multiply(vec3.create(), vec3.fromValues(center[0], center[1], center[2]), vec3.fromValues(-1, -1, -1)));
            node.addTransformation({ id: translationMatrixId, matrix: translationMatrix });
        }

        if (this._viewport) {
            if (this._viewport && node.excludeViewports.includes(this._viewport) === false && (node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._viewport)) === false) {
                const nodeId = await this.convertNode(node);
                if (nodeId !== -1) sceneDef.nodes?.push(nodeId);
            }
        } else {
            const nodeId = await this.convertNode(node);
            if (nodeId !== -1) sceneDef.nodes?.push(nodeId);
        }

        for (let i = 0; i < node.transformations.length; i++)
            if (node.transformations[i].id === globalTransformationInverseId)
                node.removeTransformation(node.transformations[i]);

        if (convertForAR) {
            // remove translation the matrix
            for (let i = 0; i < node.transformations.length; i++)
                if (node.transformations[i].id === translationMatrixId)
                    node.removeTransformation(node.transformations[i]);
        }

        this._content.scenes = [];
        this._content.scenes.push(sceneDef);

        this.convertAnimations();

        // Declare extensions.
        if (this._extensionsUsed.length > 0) this._content.extensionsUsed = this._extensionsUsed;
        if (this._extensionsRequired.length > 0) this._content.extensionsRequired = this._extensionsRequired;

        let promisesLength = 0;
        while (promisesLength !== this._promises.length) {
            promisesLength = this._promises.length;
            await Promise.all(this._promises);
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const eventProgressImagePromises: ITaskEvent = { type: TASK_TYPE.GLTF_CREATION, id: this._eventId, progress: 0.75, status: 'GlTF images resolved.' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventProgressImagePromises);

        // Merge buffers.
        const blob = new Blob(this._buffers, { type: 'application/octet-stream' });

        if (originalParent)
            originalParent.addChild(node);

        // Update byte length of the single buffer.
        if (this._content.buffers && this._content.buffers.length > 0) this._content.buffers[0].byteLength = blob.size;

        return new Promise<ArrayBuffer>((resolve, reject) => {
            // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification

            try {
                if (typeof window !== 'undefined' && window.FileReader) {
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
                            const eventEnd: ITaskEvent = { type: TASK_TYPE.GLTF_CREATION, id: this._eventId, progress: 1, status: 'GlTF creation complete.' };
                            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
                            resolve(<ArrayBuffer>glbReader.result);
                        };
                        glbReader.onerror = reject;
                    };

                    reader.onerror = reject;
                } else {
                    reject('FileReader not available.');
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    // #endregion Public Methods (1)

    // #region Private Methods (17)

    private convertAccessor(data: IAttributeData): number {
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

    private convertAnimations() {
        if (!this._content.animations && this._animations.length > 0) this._content.animations = [];
        for (let i = 0; i < this._animations.length; i++) {
            const animation = this._animations[i];
            const animationDef: IGLTF_v2_Animation = {
                name: animation.name || 'animation_' + i,
                channels: [],
                samplers: []
            };

            for (let j = 0; j < animation.tracks.length; j++) {
                const track = animation.tracks[j];
                const value = this._nodes.find(a => a.node === track.node);
                if (!value) continue;

                const inputMin = Math.min(...track.times);
                const inputMax = Math.max(...track.times);
                const inputData = new AttributeData(
                    new Float32Array(track.times),
                    1,
                    4,
                    0,
                    4,
                    false,
                    track.times.length,
                    [inputMin],
                    [inputMax]);

                const outputMin = [];
                outputMin.push(Math.min(...track.values.filter((s, i) => i % (track.path === 'rotation' ? 4 : 3) === 0)));
                outputMin.push(Math.min(...track.values.filter((s, i) => i % (track.path === 'rotation' ? 4 : 3) === 1)));
                outputMin.push(Math.min(...track.values.filter((s, i) => i % (track.path === 'rotation' ? 4 : 3) === 2)));

                if (track.path === 'rotation') {
                    outputMin.push(Math.min(...track.values.filter((s, i) => i % 4 === 3)));
                }

                const outputMax = [];
                outputMax.push(Math.max(...track.values.filter((s, i) => i % (track.path === 'rotation' ? 4 : 3) === 0)));
                outputMax.push(Math.max(...track.values.filter((s, i) => i % (track.path === 'rotation' ? 4 : 3) === 1)));
                outputMax.push(Math.max(...track.values.filter((s, i) => i % (track.path === 'rotation' ? 4 : 3) === 2)));

                if (track.path === 'rotation') {
                    outputMax.push(Math.max(...track.values.filter((s, i) => i % 4 === 3)));
                }

                const outputData = new AttributeData(
                    new Float32Array(track.values),
                    track.path === 'rotation' ? 4 : 3, //itemSize
                    track.path === 'rotation' ? 16 : 12, //itemBytes
                    0,
                    4,
                    false,
                    track.times.length,
                    outputMin,
                    outputMax,
                    track.path === 'rotation' ? 16 : 12);

                const samplerDef: {
                    input: number,
                    interpolation?: string,
                    output: number,
                } = {
                    input: this.convertAccessor(inputData),
                    output: this.convertAccessor(outputData),
                    interpolation: track.interpolation.toUpperCase()
                };
                animationDef.samplers.push(samplerDef);

                const channelDef: {
                    sampler: number,
                    target: {
                        node: number,
                        path: string,
                    }
                } = {
                    sampler: animationDef.samplers.length - 1,
                    target: {
                        node: value.id,
                        path: track.path
                    }
                };
                animationDef.channels.push(channelDef);
            }
            this._content.animations?.push(animationDef);
        }
    }

    private convertBuffer(buffer: ArrayBuffer): number {
        if (!this._content.buffers) this._content.buffers = [];
        if (this._content.buffers.length === 0) this._content.buffers = [{ byteLength: 0 }];
        this._buffers.push(buffer);
        return 0;
    }

    private convertBufferView(data: IAttributeData): number {
        if (!this._content.bufferViews) this._content.bufferViews = [];
        const componentTypeNumber = this.getComponentType(data.array);
        const componentSize = ACCESSORCOMPONENTSIZE_V2[<keyof typeof ACCESSORCOMPONENTSIZE_V2>componentTypeNumber];

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
            byteLength: byteLength,
            target: data.target
        };
        this._byteOffset += byteLength;

        this._content.bufferViews.push(bufferViewDef);
        return this._content.bufferViews.length - 1;
    }

    private async convertBufferViewImage(blob: Blob): Promise<number> {
        if (!this._content.bufferViews) this._content.bufferViews = [];
        return new Promise((resolve, reject) => {
            try {
                if (typeof window !== 'undefined' && window.FileReader) {
                    const reader = new window.FileReader();
                    reader.readAsArrayBuffer(blob);
                    reader.onloadend = () => {
                        const buffer = this.getPaddedArrayBuffer(<ArrayBuffer>reader.result);
                        const bufferViewDef = {
                            buffer: this.convertBuffer(buffer),
                            byteOffset: this._byteOffset,
                            byteLength: buffer.byteLength
                        };
                        this._byteOffset += buffer.byteLength;
                        this._content.bufferViews!.push(bufferViewDef);
                        resolve(this._content.bufferViews!.length - 1);
                    };
                    reader.onerror = reject;
                } else {
                    reject('FileReader not available.');
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    private convertImage(data: IMapData): number | undefined {
        if (!this._content.images) this._content.images = [];
        if (data.image instanceof ArrayBuffer) return;
        if (this._imageCache[data.image.src] !== undefined) return this._imageCache[data.image.src];
        const imageDef: IGLTF_v2_Image = {};
        const canvas = document.createElement('canvas');

        canvas.width = data.image.width;
        canvas.height = data.image.height;

        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
        if (data.flipY) {
            ctx.translate(0, canvas.height);
            ctx.scale(1, - 1);
        }

        if (data.blob) {
            imageDef.mimeType = data.blob.type;
            this._promises.push(new Promise<void>((resolve, reject) => {
                try {
                    this.convertBufferViewImage(data.blob!).then(bufferViewIndex => {
                        imageDef.bufferView = bufferViewIndex;
                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            }));
        } else {
            let mimeType = 'image/png';
            if (data.image.src.endsWith('.jpg') || data.image.src.includes('image/jpeg'))
                mimeType = 'image/jpeg';

            imageDef.mimeType = mimeType;

            const DATA_URI_REGEX = /^data:(.*?)(;base64)?,(.*)$/;
            if (DATA_URI_REGEX.test(data.image.src)) {
                const byteString = atobCustom(data.image.src.split(',')[1]);
                const mimeType = data.image.src.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++)
                    ia[i] = byteString.charCodeAt(i);
                const blob = new Blob([ab], { type: mimeType });
                this._promises.push(new Promise<void>((resolve, reject) => {
                    try {
                        this.convertBufferViewImage(blob!)
                            .then(bufferViewIndex => {
                                imageDef.bufferView = bufferViewIndex;
                                resolve();
                            })
                            .catch(reject);
                    } catch (e) {
                        reject(e);
                    }
                }));
            } else {
                ctx.drawImage(data.image, 0, 0, canvas.width, canvas.height);
                this._promises.push(new Promise<void>((resolve, reject) => {
                    try {
                        canvas.toBlob(async (blob) => {
                            try {
                                const bufferViewIndex = await this.convertBufferViewImage(blob!);
                                imageDef.bufferView = bufferViewIndex;
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }, mimeType);
                    } catch (e) {
                        reject(e);
                    }
                }));
            }
        }

        this._content.images.push(imageDef);
        this._imageCache[data.image.src] = this._content.images.length - 1;
        return this._content.images.length - 1;
    }

    private convertMaterial(data: IMaterialAbstractData, includeMaps = true): number {
        if (!this._content.materials) this._content.materials = [];
        if (this._materialCache[data.id + '_' + data.version] !== undefined) return this._materialCache[data.id + '_' + data.version];

        const materialDef: IGLTF_v2_Material = {
            name: data.id,
            pbrMetallicRoughness: {}
        };

        if (data instanceof MaterialSpecularGlossinessData) {
            if (!this._extensionsUsed.includes('KHR_materials_pbrSpecularGlossiness'))
                this._extensionsUsed.push('KHR_materials_pbrSpecularGlossiness');
            if (!this._extensionsRequired.includes('KHR_materials_pbrSpecularGlossiness'))
                this._extensionsRequired.push('KHR_materials_pbrSpecularGlossiness');

            const ext: IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness = {};

            ext.diffuseFactor = this._converter.toColorArray(data.color);
            ext.diffuseFactor[3] = data.opacity;
            if (data.map && includeMaps) {
                const textureIndex = this.convertTexture(data.map);
                if (textureIndex !== undefined) ext.diffuseTexture = { index: textureIndex };
            }
            ext.specularFactor = this._converter.toColorArray(data.specular);
            ext.glossinessFactor = data.glossiness;
            if (data.specularGlossinessMap && includeMaps) {
                const textureIndex = this.convertTexture(data.specularGlossinessMap);
                if (textureIndex !== undefined) ext.specularGlossinessTexture = { index: textureIndex };
            }

            materialDef.extensions = {
                KHR_materials_pbrSpecularGlossiness: ext
            };
        } else if (data instanceof MaterialUnlitData) {
            if (!this._extensionsUsed.includes('KHR_materials_unlit'))
                this._extensionsUsed.push('KHR_materials_unlit');
            if (!this._extensionsRequired.includes('KHR_materials_unlit'))
                this._extensionsRequired.push('KHR_materials_unlit');
            materialDef.pbrMetallicRoughness!.baseColorFactor = this._converter.toColorArray(data.color);
            materialDef.pbrMetallicRoughness!.baseColorFactor[3] = data.opacity;
            if (data.map && includeMaps) {
                const textureIndex = this.convertTexture(data.map);
                if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.baseColorTexture = { index: textureIndex };
            }

            materialDef.extensions = {
                KHR_materials_unlit: {}
            };
        } else {
            const standardMaterialData = data as MaterialStandardData;
            materialDef.pbrMetallicRoughness!.baseColorFactor = this._converter.toColorArray(standardMaterialData.color);
            materialDef.pbrMetallicRoughness!.baseColorFactor[3] = standardMaterialData.opacity;
            if (standardMaterialData.map && includeMaps) {
                const textureIndex = this.convertTexture(standardMaterialData.map);
                if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.baseColorTexture = { index: textureIndex };
            }
            materialDef.pbrMetallicRoughness!.metallicFactor = standardMaterialData.metalness;
            materialDef.pbrMetallicRoughness!.roughnessFactor = standardMaterialData.roughness;
            if (standardMaterialData.metalnessRoughnessMap && includeMaps) {
                const textureIndex = this.convertTexture(standardMaterialData.metalnessRoughnessMap);
                if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: textureIndex };
            } else if (standardMaterialData.metalnessMap && standardMaterialData.roughnessMap && includeMaps) {
                if (this._globalAccessObjects.combineTextures) {
                    this._promises.push(new Promise<void>((resolve, reject) => {
                        try {
                            // no support for combining textures
                            if (!this._globalAccessObjects.combineTextures) return standardMaterialData.roughnessMap;

                            this._globalAccessObjects.combineTextures(
                                undefined,
                                standardMaterialData.roughnessMap ? standardMaterialData.roughnessMap.image : undefined,
                                standardMaterialData.metalnessMap ? standardMaterialData.metalnessMap.image : undefined
                            )
                                .then(imageData => {
                                    const m = (standardMaterialData.roughnessMap! || standardMaterialData.metalnessMap!)!;

                                    const mapData = new MapData(imageData.image,
                                        {
                                            blob: imageData.blob,
                                            wrapS: m.wrapS,
                                            wrapT: m.wrapT,
                                            minFilter: m.minFilter,
                                            magFilter: m.magFilter,
                                            center: m.center,
                                            color: m.color,
                                            offset: m.offset,
                                            repeat: m.repeat,
                                            rotation: m.rotation,
                                            texCoord: m.texCoord,
                                            flipY: m.flipY
                                        }
                                    );

                                    const textureIndex = this.convertTexture(mapData);
                                    if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: textureIndex };
                                    resolve();
                                })
                                .catch(reject);
                        } catch (e) {
                            reject(e);
                        }
                    }));
                } else {
                    // no support for combining textures
                    const textureIndex = this.convertTexture(standardMaterialData.roughnessMap);
                    if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: textureIndex };
                }
            } else if (standardMaterialData.metalnessMap && includeMaps) {
                const textureIndex = this.convertTexture(standardMaterialData.metalnessMap);
                if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: textureIndex };
            } else if (standardMaterialData.roughnessMap && includeMaps) {
                const textureIndex = this.convertTexture(standardMaterialData.roughnessMap);
                if (textureIndex !== undefined) materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: textureIndex };
            }
        }

        if (data.normalMap && includeMaps) {
            const textureIndex = this.convertTexture(data.normalMap);
            if (textureIndex !== undefined) materialDef.normalTexture = { index: textureIndex };
        }

        if (data.aoMap && includeMaps) {
            const textureIndex = this.convertTexture(data.aoMap);
            if (textureIndex !== undefined) materialDef.occlusionTexture = { index: textureIndex };
        }

        if (data.emissiveMap && includeMaps) {
            const textureIndex = this.convertTexture(data.emissiveMap);
            if (textureIndex !== undefined) materialDef.emissiveTexture = { index: textureIndex };
        }

        if (data.emissiveness) materialDef.emissiveFactor = this._converter.toColorArray(data.emissiveness);
        materialDef.alphaMode = data.alphaMode.toUpperCase();
        if (data.alphaMode === MATERIAL_ALPHA.MASK) materialDef.alphaCutoff = data.alphaCutoff;
        materialDef.doubleSided = data.side === MATERIAL_SIDE.DOUBLE;

        this._content.materials.push(materialDef);

        this._materialCache[data.id + '_' + data.version] = this._content.materials.length - 1;
        return this._materialCache[data.id + '_' + data.version];
    }

    private convertMesh(data: IGeometryData): number {
        if (!this._content.meshes) this._content.meshes = [];
        if (this._meshCache[data.id + '_' + data.version] !== undefined) return this._meshCache[data.id + '_' + data.version];

        const meshDef: IGLTF_v2_Mesh = {
            primitives: [],
            name: data.id
        };

        meshDef.primitives?.push(this.convertPrimitive(data, data.primitive));

        this._content.meshes.push(meshDef);
        this._meshCache[data.id + '_' + data.version] = this._content.meshes.length - 1;
        return this._meshCache[data.id + '_' + data.version];
    }

    private async convertNode(node: ITreeNode): Promise<number> {
        if (!this._content.nodes) this._content.nodes = [];
        const nodeDef: IGLTF_v2_Node = {
            name: this._convertForAR ? this._uuidGenerator.create() : node.name,
        };

        if (node.transformations.length > 0) {
            let matrix = node.nodeMatrix;
            if (node.nodeMatrix.filter(v => isNaN(v) || v === Infinity || v === -Infinity).length > 0)
                matrix = mat4.create();

            const inv = mat4.invert(mat4.create(), matrix);
            if (inv) {
                nodeDef.matrix = [];
                for (let i = 0; i < matrix.length; i++)
                    nodeDef.matrix[i] = matrix[i];
            } else {
                Logger.instance.warn(`GLTFConverter.convertNode: The matrix of node ${node.name} is not invertible and will be ignored.`);
            }
        }

        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                const geometryData = <GeometryData>node.data[i];

                let instanceMatrices: mat4[] | undefined;
                // as this is a node that contains a mesh
                // we check the parent node for instance matrices
                if(node.parent) {
                    const instanceMatricesData = node.parent.data.find(d => d instanceof InstanceData) as InstanceData;
                    if(instanceMatricesData && instanceMatricesData.instanceMatrices && instanceMatricesData.instanceMatrices.length > 0) {
                        instanceMatrices = instanceMatricesData.instanceMatrices;
                    }
                }

                if (this._convertForAR) {
                    if (geometryData.mode !== PRIMITIVE_MODE.POINTS &&
                        geometryData.mode !== PRIMITIVE_MODE.LINES &&
                        geometryData.mode !== PRIMITIVE_MODE.LINE_LOOP &&
                        geometryData.mode !== PRIMITIVE_MODE.LINE_STRIP) {
                        
                        if(instanceMatrices) { 
                            if(!nodeDef.children) nodeDef.children = [];
                            const meshDef = this.convertMesh(geometryData);

                            // create intermediate nodes for each instance
                            for(let j = 0; j < instanceMatrices.length; j++) {
                                this._content.nodes.push({
                                    name: node.name + '_instance_' + j,
                                    matrix: Array.from(instanceMatrices[j]),
                                    mesh: meshDef,
                                });
                                nodeDef.children?.push(this._content.nodes.length - 1);
                            }
                        } else {
                            nodeDef.mesh = this.convertMesh(geometryData);
                        }
                    }
                } else {
                    nodeDef.mesh = this.convertMesh(geometryData);

                    if(instanceMatrices) {
                        if(!nodeDef.extensions) nodeDef.extensions = {};
                        nodeDef.extensions[GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING] = this.convertInstances(instanceMatrices);
                        if(!this._extensionsUsed.includes(GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING)) 
                            this._extensionsUsed.push(GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING);
                        if(!this._extensionsRequired.includes(GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING))
                            this._extensionsRequired.push(GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING);
                    }
                }                
            }

            if (node.data[i] instanceof AnimationData)
                this._animations.push(<AnimationData>node.data[i]);
        }

        if (node.children.length > 0) nodeDef.children = [];
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].visible === true) {
                if (this._viewport) {
                    if (node.children[i].excludeViewports.includes(this._viewport)) continue;
                    if (node.children[i].restrictViewports.length > 0 && !node.children[i].restrictViewports.includes(this._viewport)) continue;
                }
                const nodeId = await this.convertNode(node.children[i]);
                if (nodeId !== -1) nodeDef.children?.push(nodeId);
            }
        }

        // remove children array if it is empty
        if (nodeDef.children !== undefined && nodeDef.children.length === 0)
            nodeDef.children = undefined;

        if (performance.now() - this._progressTimer > this._progressUpdateLimit) {
            this._progressTimer = performance.now();
            const eventProgress: ITaskEvent = { type: TASK_TYPE.GLTF_CREATION, id: this._eventId, progress: (this._content.nodes.length / this._numberOfNodes) / 2, status: `GlTF conversion progress: ${this._content.nodes.length}/${this._numberOfNodes} nodes.` };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventProgress);
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // if the node is empty, don't add it
        if (nodeDef.camera === undefined && nodeDef.children === undefined && nodeDef.mesh === undefined && nodeDef.extensions === undefined && nodeDef.extras === undefined && nodeDef.skin === undefined) return -1;

        this._content.nodes.push(nodeDef);
        this._nodes.push({
            node,
            id: this._content.nodes.length - 1
        });

        return this._content.nodes.length - 1;
    }

    private convertInstances(matrices: mat4[]): any {
        const translations = matrices.map(m => mat4.getTranslation(vec3.create(), m));
        const translationMap = translations.flatMap(t => Array.from(t));
        const { minimum: minTranslation, maximum: maxTranslation } = translations.reduce((acc, t) => {
            for (let i = 0; i < 3; i++) {
                acc.minimum[i] = Math.min(acc.minimum[i], t[i]);
                acc.maximum[i] = Math.max(acc.maximum[i], t[i]);
            }
            return acc;
        }, { minimum: [Infinity, Infinity, Infinity], maximum: [-Infinity, -Infinity, -Infinity] });


        const rotations = matrices.map(m => mat4.getRotation(quat.create(), m));
        const rotationsMap = rotations.flatMap(r => Array.from(r));
        const { minimum: minRotation, maximum: maxRotation } = rotations.reduce((acc, r) => {
            for (let i = 0; i < 4; i++) {
                acc.minimum[i] = Math.min(acc.minimum[i], r[i]);
                acc.maximum[i] = Math.max(acc.maximum[i], r[i]);
            }
            return acc;
        }, { minimum: [Infinity, Infinity, Infinity, Infinity], maximum: [-Infinity, -Infinity, -Infinity, -Infinity] });

        const scales = matrices.map(m => mat4.getScaling(vec3.create(), m));
        const scalesMap = scales.flatMap(s => Array.from(s));
        const { minimum: minScale, maximum: maxScale } = scales.reduce((acc, s) => {
            for (let i = 0; i < 3; i++) {
                acc.minimum[i] = Math.min(acc.minimum[i], s[i]);
                acc.maximum[i] = Math.max(acc.maximum[i], s[i]);
            }
            return acc;
        }, { minimum: [Infinity, Infinity, Infinity], maximum: [-Infinity, -Infinity, -Infinity] });

        return {
            attributes: {
                TRANSLATION: this.convertAccessor(new AttributeData(new Float32Array(translationMap), 3, 3 * 4, 0, 4, false, translations.length, minTranslation, maxTranslation)),
                ROTATION: this.convertAccessor(new AttributeData(new Float32Array(rotationsMap), 4, 4 * 4, 0, 4, false, rotations.length, minRotation, maxRotation)),
                SCALE: this.convertAccessor(new AttributeData(new Float32Array(scalesMap), 3, 3 * 4, 0, 4, false, scales.length, minScale, maxScale))
            }
        };
    }

    private convertPrimitive(geometryData: IGeometryData, data: IPrimitiveData): IGLTF_v2_Primitive {
        const primitiveDef: IGLTF_v2_Primitive = {
            attributes: {},
            mode: geometryData.mode
        };

        for (const a in data.attributes) {
            if (data.attributes[a].array.length > 0) {
                if (a.includes('COLOR')) {
                    if (data.attributes[a].itemSize % 4 === 0) {
                        primitiveDef.attributes[a] = this.convertAccessor(data.attributes[a]);
                    } else if (data.attributes[a].itemSize % 3 === 0) {
                        const oldAttributeData = data.attributes[a];
                        const newArray = new Float32Array((oldAttributeData.array.length / 3) * 4);

                        let counter = 0;
                        for (let i = 0; i < newArray.length; i += 4) {
                            newArray[i] = oldAttributeData.array[counter] / (oldAttributeData.elementBytes === 1 ? 255.0 : 1.0);
                            newArray[i + 1] = oldAttributeData.array[counter + 1] / (oldAttributeData.elementBytes === 1 ? 255.0 : 1.0);
                            newArray[i + 2] = oldAttributeData.array[counter + 2] / (oldAttributeData.elementBytes === 1 ? 255.0 : 1.0);
                            newArray[i + 3] = 1.0;
                            counter += 3;
                        }
                        primitiveDef.attributes[a] = this.convertAccessor(new AttributeData(newArray, 4, 4 * 4, oldAttributeData.byteOffset, 4, oldAttributeData.normalized, oldAttributeData.count, oldAttributeData.min, oldAttributeData.max, oldAttributeData.byteStride));
                    }
                } else {
                    primitiveDef.attributes[a] = this.convertAccessor(data.attributes[a]);
                }
            }
        }

        if (data.indices && data.indices.array.length > 0) 
            primitiveDef.indices = this.convertAccessor(data.indices);

        if (geometryData.material) {
            const k = Object.keys(primitiveDef.attributes).find(k => k.includes('TEXCOORD'));
            primitiveDef.material = this.convertMaterial(geometryData.material, !!k);
        }

        return primitiveDef;
    }

    private convertTexture(data: IMapData): number | undefined {
        if (!this._content.textures) this._content.textures = [];

        const imageIndex = this.convertImage(data);
        if (imageIndex === undefined) return;
        const textureDef: IGLTF_v2_Texture = {
            source: imageIndex
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

    private getMinMax(data: IAttributeData): { min: number[], max: number[] } {
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

    private reset() {
        this._animations = [];
        this._buffers = [];
        this._byteOffset = 0;
        this._content = {
            asset: {
                copyright: '2025 (c) ShapeDiver',
                generator: 'ShapeDiverViewer@' + build_data.build_version,
                version: '2.0',
                extensions: {}
            },
        };

        this._extensionsRequired = [];
        this._extensionsUsed = [];
        this._imageCache = {};
        this._materialCache = {};
        this._meshCache = {};
        this._nodes = [];
        this._promises = [];

        this._convertForAR = false;
        this._viewport = undefined;
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

    // #endregion Private Methods (17)
}

// #endregion Classes (1)

// #region Enums (1)

export enum GLTF_EXTENSIONS {
    KHR_BINARY_GLTF = 'KHR_binary_glTF',
    KHR_MATERIALS_PBRSPECULARGLOSSINESS = 'KHR_materials_pbrSpecularGlossiness',
    KHR_MATERIALS_UNLIT = 'KHR_materials_unlit',
    EXT_MESH_GPU_INSTANCING = 'EXT_mesh_gpu_instancing'
}

// #endregion Enums (1)
