import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { Converter, HttpClient, SDError, UuidGenerator } from '@shapediver/viewer.shared.utils';

import { ACCESSORCOMPONENTTYPE_V1 as ACCESSOR_COMPONENTTYPE, ACCESSORTYPE_V1 as ACCESSORTYPE, IGLTF_v1, IGLTF_v1_Material } from '@shapediver/viewer.data-engine.shared-types';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { AttributeData, GeometryData, MaterialData, MATERIAL_SIDE, PrimitiveData } from '@shapediver/viewer.shared.types';
import { container } from 'tsyringe';
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils';
import { SDGTFLoader } from './SDGTFLoader';

export class GLTFLoader {
    // #region Properties (5)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _implementedExtensions = ['KHR_materials_common'];
    private readonly _converter: Converter = <Converter>container.resolve(Converter);

    private _body!: ArrayBuffer;
    private _content!: IGLTF_v1;

    // #endregion Properties (5)

    // #region Public Methods (1)

    public async load(url?: string | undefined): Promise<TreeNode> {
        let binaryGeometry: ArrayBuffer;

        try {
            binaryGeometry = (await this._httpClient.get(url!, {
                responseType: 'arraybuffer'
            })).data;
        } catch (e) {            
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, new SDError(e.message, e), `GLTFLoader.load: Initial loading of geometry failed.`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError(e.message, e), `GLTFLoader.load: Initial loading of geometry failed.`, false)
            }
            return new TreeNode();
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
            this._logger.error(LOGGINGTOPIC.DATAPROCESSING, new SDError('GLTFLoader.load: Invalid data: glTF magic wrong.'));
            return new TreeNode();
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
            return node;
        } catch (e) {            
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.DATAPROCESSING, e, `GLTFLoader.load: Loading of geometry failed. ${e.message}`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.DATAPROCESSING, e, `GLTFLoader.load: Loading of geometry failed. ${e.message}`, false)
            }
            return new TreeNode();
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
                this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'GLTFLoader.validateVersionAndExtensions: ' + message);
            }
        }
    }

    private async loadAccessor(accessorName: string): Promise<AttributeData> {
        if (!this._content.accessors![accessorName]) throw new SDError('Accessor not available.')
        const accessor = this._content.accessors![accessorName];
        const bufferView = await this.loadBufferView(accessor.bufferView!);

        const itemSize = ACCESSORTYPE[<keyof typeof ACCESSORTYPE>accessor.type];
        const ArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.componentType];
        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;

        const byteOffset = accessor.byteOffset || 0;
        const byteStride = accessor.byteStride;
        const normalized = false;

        // The buffer is not interleaved if the stride is the item size in bytes.
        if (accessor.byteStride !== itemBytes) {
            return new AttributeData(new ArrayType(bufferView), itemSize, itemBytes, byteOffset, elementBytes, normalized, byteStride);
        } else {
            return new AttributeData(new ArrayType(bufferView), itemSize, itemBytes, byteOffset, elementBytes, normalized, byteStride);
        }
    }

    private async loadBuffer(bufferName: string): Promise<ArrayBuffer> {
        if (!this._content.buffers![bufferName]) throw new SDError('Buffer not available.')
        const buffer = this._content.buffers![bufferName];

        if (bufferName === 'binary_glTF')
            return this._body;

        if (buffer.type === 'arraybuffer') {
            const binaryGeometry: ArrayBuffer = (await this._httpClient.get(buffer.uri!, {
                responseType: 'arraybuffer'
            })).data;
            return binaryGeometry;
        }
        return this._body;
    }

    private async loadBufferView(bufferViewName: string): Promise<ArrayBuffer> {
        if (!this._content.bufferViews![bufferViewName]) throw new SDError('Buffer View not available.')
        const bufferView = this._content.bufferViews![bufferViewName];
        const buffer: ArrayBuffer = await this.loadBuffer(bufferView.buffer!);
        const byteLength = bufferView.byteLength !== undefined ? bufferView.byteLength : 0;

        return buffer.slice(bufferView.byteOffset!, bufferView.byteOffset! + byteLength);
    }


    private async loadMaterial(materialName: string): Promise<MaterialData> {
        if(!this._content.materials![materialName]) throw new SDError('Material not available.')
        const material: IGLTF_v1_Material = this._content.materials![materialName];
        const materialData = new MaterialData();
        if(material.name !== undefined) materialData.name = material.name;

        if(material.extensions && material.extensions.KHR_materials_common) {
            const technique = material.extensions.KHR_materials_common.technique;
            if(technique && technique !== 'BLINN') this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'The technique ' + technique + ' is not supported. Trying to load the material either way.')
            const values = material.extensions.KHR_materials_common.values;

            if (values.hasOwnProperty('ambient')) 
                this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'GLTFLoader.loadMaterial: The value ambient was set for a material, but is not supported.')

            if (values.hasOwnProperty('doubleSided')) 
                materialData.side = values.doubleSided ? MATERIAL_SIDE.DOUBLE : MATERIAL_SIDE.FRONT;

            materialData.color = '#d3d3d3';
            if (values.hasOwnProperty('diffuse') && Array.isArray(values.diffuse)) {
                materialData.color = this._converter.toColor(values.diffuse);
                materialData.opacity = Math.max(0.0, Math.min(values.diffuse[3], 1.0));
            } else if(values.hasOwnProperty('diffuse') && !Array.isArray(values.diffuse)) {
                this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'GLTFLoader.loadMaterial: The value diffuse was set for a material, but is not supported in that type.')
            }

            if (values.hasOwnProperty('emission') && Array.isArray(values.emission)) {
                materialData.emissiveness = this._converter.toColor(values.emission);
            } else {
                this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'GLTFLoader.loadMaterial: The value emission was set for a material, but is not supported in that type.')
            }

            if (values.hasOwnProperty('shininess')) {
                materialData.metalness = Math.min(1, values.shininess);
                materialData.roughness = 1 - Math.min(1, values.shininess);
            }

            if (values.hasOwnProperty('transparency')) 
                materialData.opacity = Math.max(0.0, Math.min(values.transparency, 1.0));

            if (values.hasOwnProperty('transparent')) 
                this._logger.info(LOGGINGTOPIC.DATAPROCESSING, 'GLTFLoader.loadMaterial: The value transparent was set for a material, but is not supported.')

            if (values.hasOwnProperty('_roughness'))
                materialData.roughness = Math.min(1, Math.max(0, values.roughness));

            if (values.hasOwnProperty('_metalness'))
                materialData.metalness = Math.min(1, Math.max(0, values.metalness));
        }
        return materialData;
    }

    private async loadMesh(meshName: string): Promise<TreeNode> {
        if (!this._content.meshes![meshName]) throw new SDError('Mesh not available.')
        const mesh = this._content.meshes![meshName];
        const meshNode = new TreeNode(meshName);

        for (let i = 0, len = mesh.primitives!.length; i < len; i++) {
            const primitiveNode = new TreeNode('primitive_' + i);
            meshNode.addChild(primitiveNode);
            
            let primitive = mesh.primitives![i];
            const attributes: {
                [key: string]: AttributeData
            } = {};

            for (let attribute in primitive.attributes) {
                attributes[attribute] = await this.loadAccessor(primitive.attributes[attribute]);
                if(attribute === 'COLOR')
                    attributes[attribute] = new AttributeData(attributes[attribute].array, attributes[attribute].itemSize, attributes[attribute].itemBytes, attributes[attribute].byteOffset, attributes[attribute].elementBytes, true, attributes[attribute].byteStride)
            }

            let material: MaterialData;
            if(primitive.material) {
                material = await this.loadMaterial(primitive.material);
            } else {
                material = new MaterialData({ color: '#d3d3d3', roughness: 1, metalness: 0 });
            }

            const geometry = new GeometryData(new PrimitiveData(attributes, 4, await this.loadAccessor(primitive.indices!), material));
            primitiveNode.data.push(geometry);
        }
        return meshNode;
    }

    private async loadNode(nodeName: string): Promise<TreeNode> {
        if (!this._content.nodes![nodeName]) throw new SDError('Node not available.')
        const node = this._content.nodes![nodeName];
        const nodeDef = new TreeNode(nodeName);

        if (node.matrix) {
            nodeDef.transformations.push({
                id: this._uuidGenerator.create(),
                name: 'glTFNode_' + nodeName,
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
                name: 'glTFNode_' + nodeName,
                matrix: matrix
            });
        }

        for (let i = 0, len = node.meshes!.length; i < len; i++) {
            // we create a child node as we one want to have one mesh as in the GLTF2 def
            nodeDef.addChild(await this.loadMesh(node.meshes![i]));
        }

        if (node.children) {
            for (let i = 0, len = node.children!.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadNode(node.children![i]));
            }
        }

        return nodeDef;
    }

    private async loadScene(): Promise<TreeNode> {
        if (!this._content.scene) throw new SDError('No scene.')
        if (!this._content.scenes![this._content.scene!]) throw new SDError('Scene not available.')
        const scene = this._content.scenes![this._content.scene!];
        const sceneDef = new TreeNode(this._content.scene!);
        for (let i = 0, len = scene.nodes!.length; i < len; i++)
            sceneDef.addChild(await this.loadNode(scene.nodes![i]));
        return sceneDef;
    }
    // #endregion Private Methods (6)
}