import { build_data } from '@shapediver/viewer.shared.build-data'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Converter, UuidGenerator } from '@shapediver/viewer.shared.services'
import { container, singleton } from 'tsyringe'
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
    IGLTF_v2_Texture,
    IGLTF_v2_Image,
    IGLTF_v2_Animation,
} from '@shapediver/viewer.data-engine.shared-types'
import { mat4, vec3 } from 'gl-matrix'
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
} from '@shapediver/viewer.shared.types'
import { combineTextures } from "@shapediver/viewer.utils.texture-unifier"

export enum GLTF_EXTENSIONS {
    KHR_BINARY_GLTF = 'KHR_binary_glTF',
    KHR_MATERIALS_PBRSPECULARGLOSSINESS = 'KHR_materials_pbrSpecularGlossiness',
    KHR_MATERIALS_UNLIT = 'KHR_materials_unlit',
}

@singleton()
export class GLTFConverter {
    // #region Properties (17)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _globalTransformationInverse = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _animations: IAnimationData[] = [];
    private _buffers: ArrayBuffer[] = [];
    private _byteOffset: number = 0;
    private _content: IGLTF_v2 = {
        asset: {
            copyright: '2021 (c) ShapeDiver',
            generator: 'ShapeDiverViewer@' + build_data.build_version,
            version: '2.0',
            extensions: {}
        },
    }

    private _convertForAR = false;
    private _extensionsRequired: string[] = [];
    private _extensionsUsed: string[] = [];
    private _imageCache: { [key: string]: number } = {};
    private _nodes: {
        node: ITreeNode,
        id: number
    }[] = [];
    private _promises: Promise<any>[] = [];
    private _viewport?: string;

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor() { }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public async convert(node: ITreeNode, convertForAR = false, viewport?: string): Promise<ArrayBuffer> {
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

        const nodeMatrix = mat4.clone(node.nodeMatrix);
        const globalTransformationInverseId = this._uuidGenerator.create();
        node.addTransformation({
            id: globalTransformationInverseId,
            matrix: this._globalTransformationInverse,
        })

        const translationMatrixId = this._uuidGenerator.create();
        if(convertForAR) {
          // add translation matrix to scene tree node
          const bb = node.boundingBox.clone().applyMatrix(mat4.invert(mat4.create(), nodeMatrix));
          const center = bb.boundingSphere.center;
          let translationMatrix: mat4 = mat4.fromTranslation(mat4.create(), vec3.multiply(vec3.create(), vec3.fromValues(center[0], center[1], center[2]), vec3.fromValues(-1, -1, -1)));
          node.addTransformation({ id: translationMatrixId, matrix: translationMatrix })
        }

        if (this._viewport) {
            if(this._viewport && node.excludeViewports.includes(this._viewport) === false && (node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._viewport)) === false) {
                sceneDef.nodes?.push(this.convertNode(node));
            }
        } else {
            sceneDef.nodes?.push(this.convertNode(node));
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
        // Merge buffers.
        const blob = new Blob(this._buffers, { type: 'application/octet-stream' });
        
        if(originalParent)
            originalParent.addChild(node);

        // Update byte length of the single buffer.
        if (this._content.buffers && this._content.buffers.length > 0) this._content.buffers[0].byteLength = blob.size;

        return new Promise<ArrayBuffer>(resolve => {
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
                    resolve(<ArrayBuffer>glbReader.result);
                };

            };
        })
    }

    // #endregion Public Methods (1)

    // #region Private Methods (18)

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
            }

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
                    track.path === 'rotation' ? 16 : 12)

                const samplerDef: {
                    input: number,
                    interpolation?: string,
                    output: number,
                } = {
                    input: this.convertAccessor(inputData),
                    output: this.convertAccessor(outputData),
                    interpolation: track.interpolation.toUpperCase()
                }
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
                }
                animationDef.channels.push(channelDef);
            }
            this._content.animations?.push(animationDef)
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

    private async convertBufferViewImage(blob: Blob): Promise<number> {
        if (!this._content.bufferViews) this._content.bufferViews = [];
        return new Promise((resolve) => {
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
        });
    }

    private convertImage(data: IMapData): number {
        if (!this._content.images) this._content.images = [];
        if (this._imageCache[data.image.src]) return this._imageCache[data.image.src];
        const imageDef: IGLTF_v2_Image = {};
        const canvas = document.createElement('canvas');

        canvas.width = data.image.width;
        canvas.height = data.image.height;

        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
        if (data.flipY) {
            ctx.translate(0, canvas.height);
            ctx.scale(1, - 1);
        }

        let mimeType = 'image/png';
        if (data.image.src.endsWith('.jpg') || data.image.src.includes('image/jpeg'))
            mimeType = 'image/jpeg';

        imageDef.mimeType = mimeType;

        const DATA_URI_REGEX = /^data:(.*?)(;base64)?,(.*)$/;
        if (DATA_URI_REGEX.test(data.image.src)) {
            const byteString = atob(data.image.src.split(',')[1]);
            const mimeType = data.image.src.split(',')[0].split(':')[1].split(';')[0]
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++)
                ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: mimeType });
            this._promises.push(new Promise<void>(async (resolve) => {
                const bufferViewIndex = await this.convertBufferViewImage(blob!);
                imageDef.bufferView = bufferViewIndex;
                resolve();
            }));
        } else {
            ctx.drawImage(data.image, 0, 0, canvas.width, canvas.height);
            this._promises.push(new Promise<void>((resolve) => {
                canvas.toBlob(async (blob) => {
                    const bufferViewIndex = await this.convertBufferViewImage(blob!);
                    imageDef.bufferView = bufferViewIndex;
                    resolve();
                }, mimeType);
            }));
        }

        this._content.images.push(imageDef);
        this._imageCache[data.image.src] = this._content.images.length - 1;
        return this._content.images.length - 1;
    }

    private convertMaterial(data: IMaterialAbstractData, includeMaps = true): number {
        if (!this._content.materials) this._content.materials = [];
        const materialDef: IGLTF_v2_Material = {
            name: data.id,
            pbrMetallicRoughness: {}
        };

        if (data instanceof MaterialSpecularGlossinessData) {
            if (!this._extensionsUsed.includes('KHR_materials_pbrSpecularGlossiness'))
                this._extensionsUsed.push('KHR_materials_pbrSpecularGlossiness')
            if (!this._extensionsRequired.includes('KHR_materials_pbrSpecularGlossiness'))
                this._extensionsRequired.push('KHR_materials_pbrSpecularGlossiness')

            const ext: IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness = {};

            ext.diffuseFactor = this._converter.toColorArray(data.color);
            ext.diffuseFactor[3] = data.opacity;
            if (data.map && includeMaps) ext.diffuseTexture = { index: this.convertTexture(data.map) }
            ext.specularFactor = this._converter.toColorArray(data.specular);
            ext.glossinessFactor = data.glossiness;
            if (data.specularGlossinessMap && includeMaps)
                ext.specularGlossinessTexture = { index: this.convertTexture(data.specularGlossinessMap) };

            materialDef.extensions = {
                KHR_materials_pbrSpecularGlossiness: ext
            }
        } else if (data instanceof MaterialUnlitData) {
            if (!this._extensionsUsed.includes('KHR_materials_unlit'))
                this._extensionsUsed.push('KHR_materials_unlit')
            if (!this._extensionsRequired.includes('KHR_materials_unlit'))
                this._extensionsRequired.push('KHR_materials_unlit')
            materialDef.pbrMetallicRoughness!.baseColorFactor = this._converter.toColorArray(data.color);
            materialDef.pbrMetallicRoughness!.baseColorFactor[3] = data.opacity;
            if (data.map && includeMaps) materialDef.pbrMetallicRoughness!.baseColorTexture = { index: this.convertTexture(data.map) }

            materialDef.extensions = {
                KHR_materials_unlit: {}
            };
        } else {
            const standardMaterialData = data as MaterialStandardData;
            materialDef.pbrMetallicRoughness!.baseColorFactor = this._converter.toColorArray(standardMaterialData.color);
            materialDef.pbrMetallicRoughness!.baseColorFactor[3] = standardMaterialData.opacity;
            if (standardMaterialData.map && includeMaps) materialDef.pbrMetallicRoughness!.baseColorTexture = { index: this.convertTexture(standardMaterialData.map) }
            materialDef.pbrMetallicRoughness!.metallicFactor = standardMaterialData.metalnessMap ? 1 : standardMaterialData.metalness;
            materialDef.pbrMetallicRoughness!.roughnessFactor = standardMaterialData.roughnessMap ? 1 : standardMaterialData.roughness;
            if (standardMaterialData.metalnessRoughnessMap && includeMaps) {
                materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: this.convertTexture(standardMaterialData.metalnessRoughnessMap) };
            } else if ((standardMaterialData.metalnessMap || standardMaterialData.roughnessMap) && includeMaps) {
                this._promises.push(new Promise<void>(async resolve => {
                    const imageData = await combineTextures(
                        undefined, 
                        standardMaterialData.roughnessMap ? standardMaterialData.roughnessMap.image : undefined, 
                        standardMaterialData.metalnessMap ? standardMaterialData.metalnessMap.image : undefined
                    );
                    const m = (standardMaterialData.roughnessMap! || standardMaterialData.metalnessMap!)!;
                    materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: this.convertTexture(new MapData(imageData, m.wrapS, m.wrapT, m.minFilter, m.magFilter, m.center, m.color, m.offset, m.repeat, m.rotation, m.flipY)) }
                    resolve();
                }))
            }
        }

        if (data.normalMap && includeMaps) materialDef.normalTexture = { index: this.convertTexture(data.normalMap) };
        if (data.aoMap && includeMaps) materialDef.occlusionTexture = { index: this.convertTexture(data.aoMap) };
        if (data.emissiveMap && includeMaps) materialDef.emissiveTexture = { index: this.convertTexture(data.emissiveMap) };
        if (data.emissiveness) materialDef.emissiveFactor = this._converter.toColorArray(data.emissiveness);
        materialDef.alphaMode = data.alphaMode.toUpperCase();
        if (data.alphaMode === MATERIAL_ALPHA.MASK) materialDef.alphaCutoff = data.alphaCutoff;
        materialDef.doubleSided = data.side === MATERIAL_SIDE.DOUBLE;

        this._content.materials.push(materialDef);
        return this._content.materials.length - 1;
    }

    private convertMesh(data: IGeometryData): number {
        if (!this._content.meshes) this._content.meshes = [];
        const meshDef: IGLTF_v2_Mesh = {
            primitives: [],
            name: data.id
        };

        meshDef.primitives?.push(this.convertPrimitive(data.primitive))

        this._content.meshes.push(meshDef);
        return this._content.meshes.length - 1;
    }

    private convertNode(node: ITreeNode): number {
        if (!this._content.nodes) this._content.nodes = [];
        const nodeDef: IGLTF_v2_Node = {
            name: this._convertForAR ? this._uuidGenerator.create() : node.name,
        };

        if (node.transformations.length > 0) {
            let matrix = node.nodeMatrix;
            if(node.nodeMatrix.filter(v => isNaN(v) || v === Infinity || v === -Infinity).length > 0)
                matrix = mat4.create();

            nodeDef.matrix = [matrix[0], matrix[1], matrix[2], matrix[3],
            matrix[4], matrix[5], matrix[6], matrix[7],
            matrix[8], matrix[9], matrix[10], matrix[11],
            matrix[12], matrix[13], matrix[14], matrix[15]];

        }

        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                if (this._convertForAR) {
                    if ((<GeometryData>node.data[i]).primitive.mode !== PRIMITIVE_MODE.POINTS &&
                        (<GeometryData>node.data[i]).primitive.mode !== PRIMITIVE_MODE.LINES &&
                        (<GeometryData>node.data[i]).primitive.mode !== PRIMITIVE_MODE.LINE_LOOP &&
                        (<GeometryData>node.data[i]).primitive.mode !== PRIMITIVE_MODE.LINE_STRIP)
                        nodeDef.mesh = this.convertMesh(<GeometryData>node.data[i])
                } else {
                    nodeDef.mesh = this.convertMesh(<GeometryData>node.data[i])
                }
            }

            if (node.data[i] instanceof AnimationData)
                this._animations.push(<AnimationData>node.data[i])
        }

        if (node.children.length > 0) nodeDef.children = [];
        for (let i = 0; i < node.children.length; i++) {
            if(node.children[i].visible === true) {
                if(this._viewport) {
                    if(node.children[i].excludeViewports.includes(this._viewport)) continue;
                    if(node.children[i].restrictViewports.length > 0 && !node.children[i].restrictViewports.includes(this._viewport)) continue;
                }
                nodeDef.children?.push(this.convertNode(node.children[i]));
            }
        }

        this._content.nodes.push(nodeDef);
        this._nodes.push({
            node,
            id: this._content.nodes.length - 1
        });
        return this._content.nodes.length - 1;
    }

    private convertPrimitive(data: IPrimitiveData): IGLTF_v2_Primitive {
        const primitiveDef: IGLTF_v2_Primitive = {
            attributes: {},
            mode: data.mode
        };

        for (let a in data.attributes) {
            if (data.attributes[a].array.length > 0) {
                if (a.includes('COLOR')) {
                    if (data.attributes[a].itemSize % 4 === 0) {
                        primitiveDef.attributes[a] = this.convertAccessor(data.attributes[a])
                    } else if (data.attributes[a].itemSize % 3 === 0) {
                        const oldAttributeData = data.attributes[a];
                        const newArray = new Float32Array((oldAttributeData.array.length/3)*4);

                        let counter = 0;
                        for(let i = 0; i < newArray.length; i+=4) {
                            newArray[i] = oldAttributeData.array[counter] / (oldAttributeData.elementBytes === 1 ? 255.0 : 1.0);
                            newArray[i+1] = oldAttributeData.array[counter+1] / (oldAttributeData.elementBytes === 1 ? 255.0 : 1.0);
                            newArray[i+2] = oldAttributeData.array[counter+2] / (oldAttributeData.elementBytes === 1 ? 255.0 : 1.0);
                            newArray[i+3] = 1.0;
                            counter+=3;
                        }
                        primitiveDef.attributes[a] = this.convertAccessor(new AttributeData(newArray, 4, 4*4, oldAttributeData.byteOffset, 4, oldAttributeData.normalized, oldAttributeData.count, oldAttributeData.min, oldAttributeData.max, oldAttributeData.byteStride));
                        
                    }
                } else {
                    primitiveDef.attributes[a] = this.convertAccessor(data.attributes[a])
                }
            }
        }

        if (data.indices)
            primitiveDef.indices = this.convertAccessor(data.indices);

        if (data.material) {
            const k = Object.keys(primitiveDef.attributes).find(k => k.includes('TEXCOORD'));
            primitiveDef.material = this.convertMaterial(data.material, !!k);
        }

        return primitiveDef;
    }

    private convertTexture(data: IMapData): number {
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
                copyright: '2021 (c) ShapeDiver',
                generator: 'ShapeDiverViewer@' + build_data.build_version,
                version: '2.0',
                extensions: {}
            },
        }

        this._extensionsRequired = [];
        this._extensionsUsed = [];
        this._imageCache = {};
        this._nodes = [];
        this._promises = [];
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

    // #endregion Private Methods (18)
}