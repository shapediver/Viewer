import { build_data } from '@shapediver/viewer.shared.build-data'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
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
    PrimitiveData,
    AnimationData,
    PRIMITIVE_MODE,
    MaterialSpecularGlossinessData,
    MaterialUnlitData,
    AbstractMaterialData,
} from '@shapediver/viewer.shared.types'
import * as THREE from 'three'

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
    private readonly _mergeShader: THREE.ShaderMaterial;
    private readonly _quadCamera: THREE.OrthographicCamera;
    private readonly _quadScene: THREE.Scene;
    private readonly _renderer: THREE.WebGLRenderer;
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _animations: AnimationData[] = [];
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
        node: TreeNode,
        id: number
    }[] = [];
    private _promises: Promise<any>[] = [];

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor() {
        this._mergeShader = new THREE.ShaderMaterial({
            uniforms: {
                tRed: { value: null },
                activeRed: { value: false },
                defaultRed: { value: 1.0 },
                tGreen: { value: null },
                activeGreen: { value: false },
                defaultGreen: { value: 1.0 },
                tBlue: { value: null },
                activeBlue: { value: false },
                defaultBlue: { value: 1.0 },
            },
            vertexShader: `// @author Michael Oppitz 

            uniform sampler2D tRed;
            uniform bool activeRed;
            uniform float defaultRed;
            
            uniform sampler2D tGreen;		
            uniform bool activeGreen;
            uniform float defaultGreen;
            
            uniform sampler2D tBlue;		
            uniform bool activeBlue;
            uniform float defaultBlue;

            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
            fragmentShader: `// @author Michael Oppitz 

            uniform sampler2D tRed;
            uniform bool activeRed;
            uniform float defaultRed;
            
            uniform sampler2D tGreen;		
            uniform bool activeGreen;
            uniform float defaultGreen;
            
            uniform sampler2D tBlue;		
            uniform bool activeBlue;
            uniform float defaultBlue;
            
            varying vec2 vUv;
            
            void main() {
                vec4 outColor = vec4(0.0, 0.0, 0.0, 1.0);

                if(activeRed == true) {
                    outColor.r = texture2D(tRed, vUv).r;
                } else {
                    outColor.r = defaultRed;
                }
            
                if(activeGreen == true) {
                    outColor.g = texture2D(tGreen, vUv).g;
                } else {
                    outColor.g = defaultGreen;
                }
            
                if(activeBlue == true) {
                    outColor.b = texture2D(tBlue, vUv).b;
                } else {
                    outColor.b = defaultBlue;
                }
            
                gl_FragColor = outColor;
            }`
        });

        this._quadCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
        this._quadScene = new THREE.Scene();
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._mergeShader);
        this._quadScene.add(quad);

        this._renderer = new THREE.WebGLRenderer();
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public async convert(node: TreeNode, convertForAR = false): Promise<ArrayBuffer> {
        this.reset();

        this._convertForAR = convertForAR;
        const sceneNode = new TreeNode('ShapeDiverRootNode');
        sceneNode.addChild(node);

        const sceneDef: IGLTF_v2_Scene = {
            name: sceneNode.name,
            nodes: []
        };

        const globalTransformationInverseID = this._uuidGenerator.create();
        node.transformations.push({
            id: globalTransformationInverseID,
            matrix: this._globalTransformationInverse,
        })

        const translationMatrixID = this._uuidGenerator.create();
        if(convertForAR) {
          // add translation matrix to scene tree node
          const bb = node.boundingBox.clone();
          const translationVector = vec3.fromValues(-(bb.max[0] + bb.min[0]) / 2.0, -(bb.max[1] + bb.min[1]) / 2.0, -(bb.max[2] + bb.min[2]) / 2.0);
          let translationMatrix: mat4 = mat4.fromTranslation(mat4.create(), translationVector);
          node.transformations.push({ id: translationMatrixID, matrix: translationMatrix })
        }

        sceneDef.nodes?.push(this.convertNode(node));

        for (let i = 0; i < node.transformations.length; i++)
            if (node.transformations[i].id === globalTransformationInverseID)
                node.transformations.splice(i, 1);


        if (convertForAR) {
            // remove translation the matrix
            for (let i = 0; i < node.transformations.length; i++)
                if (node.transformations[i].id === translationMatrixID)
                    node.transformations.splice(i, 1);
        }

        this._content.scenes = [];
        this._content.scenes.push(sceneDef);

        this.convertAnimations();

        // Declare extensions.
        const extensionsUsedList = Object.keys(this._extensionsUsed);
        if (extensionsUsedList.length > 0) this._content.extensionsUsed = extensionsUsedList;
        const extensionsRequiredList = Object.keys(this._extensionsRequired);
        if (extensionsRequiredList.length > 0) this._content.extensionsRequired = extensionsRequiredList;

        let promisesLength = 0;
        while (promisesLength !== this._promises.length) {
            promisesLength = this._promises.length;
            await Promise.all(this._promises);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        // Merge buffers.
        const blob = new Blob(this._buffers, { type: 'application/octet-stream' });

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

    private async combineTextures(red?: MapData, green?: MapData, blue?: MapData): Promise<MapData> {
        if (!red && !green && !blue)
            throw new Error('No maps supplied.')

        let width = 0, height = 0;
        const textures = [red, green, blue];
        for (let t of textures) {
            if (t) {
                if (width === 0 && height === 0) {
                    width = t.image.width;
                    height = t.image.height;
                } else if (t.image.width !== width && t.image.height !== height) {
                    throw new Error('Maps have different sizes. Combining not supported.')
                }
            }
        }

        if (red) {
            const redTexture = new THREE.Texture(red.image);
            redTexture.needsUpdate = true;
            this._mergeShader.uniforms.tRed.value = redTexture;
            this._mergeShader.uniforms.activeRed.value = true;
        } else {
            this._mergeShader.uniforms.activeRed.value = false;
        }

        if (green) {
            const greenTexture = new THREE.Texture(green.image);
            greenTexture.needsUpdate = true;
            this._mergeShader.uniforms.tGreen.value = greenTexture;
            this._mergeShader.uniforms.activeGreen.value = true;
        } else {
            this._mergeShader.uniforms.activeGreen.value = false;
        }

        if (blue) {
            const blueTexture = new THREE.Texture(blue.image);
            blueTexture.needsUpdate = true;
            this._mergeShader.uniforms.tBlue.value = blueTexture;
            this._mergeShader.uniforms.activeBlue.value = true;
        } else {
            this._mergeShader.uniforms.activeBlue.value = false;
        }

        // The different render targets that are used by the passes
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
        renderTarget.texture.name = 'target.rt';
        this._renderer.setRenderTarget(renderTarget)

        this._renderer.render(this._quadScene, this._quadCamera);

        const buffer = new Uint8ClampedArray(4 * width * height);
        this._renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer)

        let imageData = new ImageData(buffer, width, height);
        var canvas = document.createElement('canvas');
        var ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);

        const image = new Image();
        const promise = new Promise<void>(resolve => {
            image.onload = () => resolve();
        })
        image.crossOrigin = "anonymous";
        image.src = canvas.toDataURL("image/jpeg", 1.0);

        await promise;

        const m = (red || green || blue)!;
        return new MapData(image, m.wrapS, m.wrapT, m.minFilter, m.magFilter, m.center, m.color, m.offset, m.repeat, m.rotation, m.flipY);
    }

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

    private convertImage(data: MapData): number {
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

    private convertMaterial(data: AbstractMaterialData, includeMaps = true): number {
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
                    const mapData = await this.combineTextures(undefined, standardMaterialData.roughnessMap, standardMaterialData.metalnessMap);
                    materialDef.pbrMetallicRoughness!.metallicRoughnessTexture = { index: this.convertTexture(mapData) }
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
            if(node.children[i].visible === true)
                nodeDef.children?.push(this.convertNode(node.children[i]));
        }

        this._content.nodes.push(nodeDef);
        this._nodes.push({
            node,
            id: this._content.nodes.length - 1
        });
        return this._content.nodes.length - 1;
    }

    private convertPrimitive(data: PrimitiveData): IGLTF_v2_Primitive {
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