import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Converter, HttpClient, PerformanceEvaluator, UuidGenerator, Logger, LOGGING_TOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import {
  ACCESSORCOMPONENTTYPE_V1 as ACCESSOR_COMPONENTTYPE,
  ACCESSORTYPE_V1 as ACCESSORTYPE,
  IGLTF_v1,
  IGLTF_v1_Material,
} from '@shapediver/viewer.data-engine.shared-types'
import { mat4, vec3, vec4 } from 'gl-matrix'
import {
  AttributeData,
  GeometryData,
  MATERIAL_SIDE,
  MaterialStandardData,
  PrimitiveData,
} from '@shapediver/viewer.shared.types'
import { container } from 'tsyringe'

import { SDGTFLoader } from './SDGTFLoader'

export class GLTFLoader {
    // #region Properties (5)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _implementedExtensions = ['KHR_materials_common'];
    private readonly _globalTransformation = mat4.fromValues(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);

    private _baseUri: string | undefined;
    private _body: ArrayBuffer | undefined;
    private _content!: IGLTF_v1;

    // #endregion Properties (5)

    // #region Public Methods (1)

    public async load(content: IGLTF_v1, gltfBinary?: ArrayBuffer, gltfHeader?: { magic: string, version: number, length: number, contentLength: number, contentFormat: number }, baseUri?: string): Promise<ITreeNode> {
        this._baseUri = baseUri;
        if(gltfBinary && gltfHeader)
            this._body = gltfBinary.slice(this.BINARY_EXTENSION_HEADER_LENGTH + gltfHeader.contentLength, gltfHeader.length);
        this._content = content;

        let sdgtfNode;
        if(gltfBinary && gltfHeader)
            sdgtfNode = await new SDGTFLoader().load(gltfBinary, gltfHeader.length);

        try {
            this.validateVersionAndExtensions();
            const node = await this.loadScene();
            if(sdgtfNode) node.addChild(sdgtfNode);
            return node;
        } catch (e) {            
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GLTFLoader.loadContent`, e);
        }
    }

    public async loadWithUrl(url?: string | undefined): Promise<ITreeNode> {
        this._performanceEvaluator.startSection('gltfProcessing.' + url);
        let binaryGeometry: ArrayBuffer;

        try {
            this._performanceEvaluator.startSection('loadGltf.' + url);
            binaryGeometry = (await this._httpClient.get(url!, {
                responseType: 'arraybuffer'
            })).data;
            this._performanceEvaluator.endSection('loadGltf.' + url);
        } catch (e) {            
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GLTFLoader.load`, e);
        }

        // create header data
        const headerDataView = new DataView(binaryGeometry, 0, this.BINARY_EXTENSION_HEADER_LENGTH);
        const header = {
            magic: String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3)),
            version: headerDataView.getUint32(4, true),
            length: headerDataView.getUint32(8, true),
            contentLength: headerDataView.getUint32(12, true),
            contentFormat: headerDataView.getUint32(16, true)
        }
        if (header.magic != 'glTF') {
            const error = new ShapeDiverViewerDataProcessingError('GLTFLoader.load: Invalid data: glTF magic wrong.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GLTFLoader.load`, error);
        }

        // create content
        const contentDataView = new DataView(binaryGeometry, this.BINARY_EXTENSION_HEADER_LENGTH, header.contentLength);
        const contentDecoded = new TextDecoder().decode(contentDataView);
        this._content = JSON.parse(contentDecoded);

        // create body
        this._body = binaryGeometry.slice(this.BINARY_EXTENSION_HEADER_LENGTH + header.contentLength, header.length);

        const sdgtfNode = await new SDGTFLoader().load(binaryGeometry, header.length);

        try {
            this.validateVersionAndExtensions();
            const node = await this.loadScene();
            node.addChild(sdgtfNode);
            this._performanceEvaluator.endSection('gltfProcessing.' + url);
            return node;
        } catch (e) {
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `GLTFLoader.load`, e);
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (6)

    private validateVersionAndExtensions(): void {
        if(this._content.extensionsUsed) {
            const notSupported = [];
            for(let i = 0; i < this._content.extensionsUsed.length; i++) {
                if(!this._implementedExtensions.includes(this._content.extensionsUsed[i])) 
                    notSupported.push(this._content.extensionsUsed[i]);
            }
            if(notSupported.length > 0) {
                let message = 'Extension' + (notSupported.length === 1 ? ' ' : 's ');
                notSupported.forEach((element, index) => {
                    message += '"' + element + '"' + (index === notSupported.length-1 ? '' : index === notSupported.length-2 ? ' and ' : ', ');
                });
                message += (notSupported.length === 1 ? ' is' : ' are') + ' not supported, but used. Loading glTF regardless.';
                this._logger.info(LOGGING_TOPIC.DATA_PROCESSING, 'GLTFLoader.validateVersionAndExtensions: ' + message);
            }
        }
    }

    private async loadAccessor(accessorName: string): Promise<AttributeData> {
        if (!this._content.accessors![accessorName]) throw new Error('Accessor not available.')
        const accessor = this._content.accessors![accessorName];
        const bufferView = await this.loadBufferView(accessor.bufferView!);

        const itemSize = ACCESSORTYPE[<keyof typeof ACCESSORTYPE>accessor.type];
        if(accessor.componentType === 5124) this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'GLTFLoader.loadAccessor: The componentType for this accessor is 5124, which is not allowed. Trying to load it anyway.');
        const ArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.componentType];
        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;

        const byteOffset = accessor.byteOffset || 0;
        const byteStride = accessor.byteStride;
        const normalized = false;

        const min = this._content.asset && this._content.asset?.generator === "ShapeDiverGltfV1Writer" ? accessor.min || [] : [];
        const max = this._content.asset && this._content.asset?.generator === "ShapeDiverGltfV1Writer" ? accessor.max || [] : [];

        // The buffer is not interleaved if the stride is the item size in bytes.
        return new AttributeData(new ArrayType(bufferView), itemSize, itemBytes, byteOffset, elementBytes, normalized, accessor.count, min, max, byteStride);
    }

    private async loadBuffer(bufferName: string): Promise<ArrayBuffer> {
        if (!this._content.buffers![bufferName]) throw new Error('Buffer not available.')
        const buffer = this._content.buffers![bufferName];

        if (bufferName === 'binary_glTF')
            return this._body!;

        if (buffer.type === 'arraybuffer') {
            const binaryGeometry: ArrayBuffer = (await this._httpClient.get(buffer.uri!, {
                responseType: 'arraybuffer'
            })).data;
            return binaryGeometry;
        }
        if(!this._body) throw new Error('Buffer not available.');
        return this._body;
    }

    private async loadBufferView(bufferViewName: string): Promise<ArrayBuffer> {
        if (!this._content.bufferViews![bufferViewName]) throw new Error('Buffer View not available.')
        const bufferView = this._content.bufferViews![bufferViewName];
        const buffer: ArrayBuffer = await this.loadBuffer(bufferView.buffer!);
        const byteLength = bufferView.byteLength !== undefined ? bufferView.byteLength : 0;

        return buffer.slice(bufferView.byteOffset!, bufferView.byteOffset! + byteLength);
    }


    private async loadMaterial(materialName: string): Promise<MaterialStandardData> {
        if(!this._content.materials![materialName]) throw new Error('Material not available.')
        const material: IGLTF_v1_Material = this._content.materials![materialName];
        const materialData = new MaterialStandardData();
        if(material.name !== undefined) materialData.name = material.name;

        if(material.extensions && material.extensions.KHR_materials_common) {
            const technique = material.extensions.KHR_materials_common.technique;
            if(technique && technique !== 'BLINN') this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'The technique ' + technique + ' is not supported. Trying to load the material either way.')
            const values = material.extensions.KHR_materials_common.values;

            if (values.hasOwnProperty('doubleSided')) 
                materialData.side = values.doubleSided ? MATERIAL_SIDE.DOUBLE : MATERIAL_SIDE.FRONT;

            materialData.color = '#d3d3d3';
            if (values.hasOwnProperty('diffuse') && Array.isArray(values.diffuse)) {
                const diffuseScaled = (<number[]>values.diffuse).map(element => element *= 255.0);
                materialData.color = this._converter.toColor(diffuseScaled);
                materialData.opacity = Math.max(0.0, Math.min(values.diffuse[3], 1.0));
            } else if(values.hasOwnProperty('diffuse')) {
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'GLTFLoader.loadMaterial: The value diffuse was set for a material, but is not supported in that type.')
            }
            
            if (!values.hasOwnProperty('diffuse') && values.hasOwnProperty('ambient')) {
                const ambientScaled = (<number[]>values.ambient).map(element => element *= 255.0);
                materialData.color = this._converter.toColor(ambientScaled);
            }

            if (values.hasOwnProperty('emission') && Array.isArray(values.emission)) {
                materialData.emissiveness = this._converter.toColor(values.emission);
            } else if (values.hasOwnProperty('emission')) {
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'GLTFLoader.loadMaterial: The value emission was set for a material, but is not supported in that type.')
            }

            if (values.hasOwnProperty('shininess')) {
                materialData.metalness = Math.min(1, values.shininess);
                materialData.roughness = 1 - Math.min(1, values.shininess);
            }

            if (values.hasOwnProperty('transparency')) 
                materialData.opacity = Math.max(0.0, Math.min(values.transparency, 1.0));

            if (!values.hasOwnProperty('transparency') && values.hasOwnProperty('transparent') && (values.transparency === 'true' || values.transparency === true))
                materialData.opacity = 0;

            if (values.hasOwnProperty('_roughness'))
                materialData.roughness = Math.min(1, Math.max(0, values.roughness));

            if (values.hasOwnProperty('_metalness'))
                materialData.metalness = Math.min(1, Math.max(0, values.metalness));
        }
        return materialData;
    }

    private async loadMesh(meshName: string): Promise<ITreeNode> {
        if (!this._content.meshes![meshName]) throw new Error('Mesh not available.')
        const mesh = this._content.meshes![meshName];
        const meshNode = new TreeNode(meshName);

        if(!mesh.primitives) return new TreeNode('primitive');
        for (let i = 0, len = mesh.primitives!.length; i < len; i++) {
            const primitiveNode = new TreeNode('primitive_' + i);
            meshNode.addChild(primitiveNode);
            
            let primitive = mesh.primitives![i];
            const attributes: {
                [key: string]: AttributeData
            } = {};

            for (let attribute in primitive.attributes) {
                // attribute name conversion to be consistent witg gltf
                let attributeName = attribute;
                if(/\d/.test(attributeName) && !attributeName.includes('_')) {
                    const index = attributeName.search(/\d/)
                    attributeName = attributeName.substring(0, index) + '_' + attributeName.substring(index, attributeName.length);
                } else if(attributeName === 'TEXCOORD' || attributeName === 'COLOR' || attributeName === 'JOINTS' || attributeName === 'WEIGHTS') {
                    attributeName += '_0';
                } else if (attributeName === 'UV') {
                    attributeName = 'TEXCOORD_0';
                }

                attributes[attributeName] = await this.loadAccessor(primitive.attributes[attribute]);
                if(attributeName.startsWith('COLOR'))
                    attributes[attributeName] = new AttributeData(attributes[attributeName].array, attributes[attributeName].itemSize, attributes[attributeName].itemBytes, attributes[attributeName].byteOffset, attributes[attributeName].elementBytes, true, attributes[attributeName].count, [], [], attributes[attributeName].byteStride)
            }

            let material: MaterialStandardData | undefined;
            if(primitive.material) 
                material = await this.loadMaterial(primitive.material);

            const geometry = new GeometryData(new PrimitiveData(attributes, 4, await this.loadAccessor(primitive.indices!), material));
            primitiveNode.data.push(geometry);
        }
        return meshNode;
    }

    private async loadNode(nodeName: string): Promise<ITreeNode> {
        if (!this._content.nodes![nodeName]) throw new Error('Node not available.')
        const node = this._content.nodes![nodeName];
        const nodeDef = new TreeNode(nodeName);

        if (node.matrix) {
            nodeDef.addTransformation({
                id: this._uuidGenerator.create(),
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
            nodeDef.addTransformation({
                id: this._uuidGenerator.create(),
                matrix: matrix
            });
        }

        if(node.meshes) {
            for (let i = 0, len = node.meshes!.length; i < len; i++) {
                // we create a child node as we one want to have one mesh as in the GLTF2 def
                nodeDef.addChild(await this.loadMesh(node.meshes![i]));
            }
        }

        if (node.children) {
            for (let i = 0, len = node.children!.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadNode(node.children![i]));
            }
        }

        return nodeDef;
    }

    private async loadScene(): Promise<ITreeNode> {
        if (!this._content.scene) throw new Error('No scene.')
        if (!this._content.scenes![this._content.scene!]) throw new Error('Scene not available.')
        const scene = this._content.scenes![this._content.scene!];
        const sceneDef = new TreeNode(this._content.scene!);
        if(this._content.asset && this._content.asset?.generator !== "ShapeDiverGltfWriter" && this._content.asset?.generator !== "ShapeDiverGltfV1Writer") {
            sceneDef.addTransformation({
                id: this._uuidGenerator.create(),
                matrix: this._globalTransformation
            })
        }
        if(scene.nodes)
            for (let i = 0, len = scene.nodes!.length; i < len; i++)
                sceneDef.addChild(await this.loadNode(scene.nodes![i]));
        return sceneDef;
    }
    // #endregion Private Methods (6)
}