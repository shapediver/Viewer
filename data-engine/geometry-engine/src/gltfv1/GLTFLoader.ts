import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { HttpClient, UuidGenerator } from '@shapediver/viewer.shared.utils';

import { ACCESSOR_COMPONENTTYPE_V1 as ACCESSOR_COMPONENTTYPE, ACCESSORTYPE_V1 as ACCESSORTYPE, IGLTF_v1 } from '@shapediver/viewer.data-engine.shared-types';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { AttributeData, GeometryData, PrimitiveData } from '@shapediver/viewer.shared.types';
import { container } from 'tsyringe';
import { Logger } from '@shapediver/viewer.shared.monitoring';

export class GLTFLoader {
    // #region Properties (5)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient = container.resolve(HttpClient);
    private readonly _uuidGenerator = container.resolve(UuidGenerator);
    private readonly _logger = container.resolve(Logger);

    private _body!: ArrayBuffer;
    private _content!: IGLTF_v1;

    // #endregion Properties (5)

    // #region Public Methods (1)

    public async load(url?: string | undefined): Promise<TreeNode> {
        const binaryGeometry: ArrayBuffer = (await this._httpClient.get(url!, {
            responseType: 'arraybuffer'
        })).data;

        // TODO handle error case

        // create header data
        const headerDataView = new DataView(binaryGeometry, 0, this.BINARY_EXTENSION_HEADER_LENGTH);
        const header = {
            magic: String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3)),
            version: headerDataView.getUint32(4, true),
            length: headerDataView.getUint32(8, true),
            contentLength: headerDataView.getUint32(12, true),
            contentFormat: headerDataView.getUint32(16, true)
        }
        if (header.magic != 'glTF') this._logger.error('ShapeDiverGLBLoader got invalid data: glTF magic wrong.');

        // create content
        const contentDataView = new DataView(binaryGeometry, this.BINARY_EXTENSION_HEADER_LENGTH, header.contentLength);
        const contentDecoded = new TextDecoder().decode(contentDataView);
        this._content = JSON.parse(contentDecoded);

        // create body
        this._body = binaryGeometry.slice(this.BINARY_EXTENSION_HEADER_LENGTH + header.contentLength, header.length);

        return await this.loadScene()
    }

    // #endregion Public Methods (1)

    // #region Private Methods (6)

    private async loadAccessor(accessorName: string): Promise<AttributeData> {
        if (!this._content.accessors![accessorName]) this._logger.error('Accessor not available')
        const accessor = this._content.accessors![accessorName];
        const bufferView = await this.loadBufferView(accessor.bufferView!);

        // @ts-ignore
        const itemSize = ACCESSORTYPE[accessor.type!];
        // @ts-ignore
        const ArrayType = ACCESSOR_COMPONENTTYPE[accessor.componentType!];
        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;

        // The buffer is not interleaved if the stride is the item size in bytes.
        if (accessor.byteStride !== itemBytes) {
            return new AttributeData(new ArrayType(bufferView), itemSize, true, accessor.byteOffset! / elementBytes, accessor.byteStride! / elementBytes);
        } else {
            return new AttributeData(new ArrayType(bufferView), itemSize, false);
        }
    }

    private async loadBuffer(bufferName: string): Promise<ArrayBuffer> {
        if (!this._content.buffers![bufferName]) this._logger.error('Buffer not available')
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
        if (!this._content.bufferViews![bufferViewName]) this._logger.error('Buffer View not available')
        const bufferView = this._content.bufferViews![bufferViewName];
        const buffer: ArrayBuffer = await this.loadBuffer(bufferView.buffer!);
        const byteLength = bufferView.byteLength !== undefined ? bufferView.byteLength : 0;

        return buffer.slice(bufferView.byteOffset!, bufferView.byteOffset! + byteLength);
    }

    private async loadMesh(meshName: string): Promise<TreeNode> {
        if (!this._content.meshes![meshName]) this._logger.error('Mesh not available')
        const mesh = this._content.meshes![meshName];
        const meshNode = new TreeNode(meshName);

        for (let i = 0, len = mesh.primitives!.length; i < len; i++) {
            const primitiveNode = new TreeNode('primitive_' + i);
            meshNode.addChild(primitiveNode);
            
            let primitive = mesh.primitives![i];
            const attributes: {
                [key: string]: AttributeData
            } = {};

            for (let attribute in primitive.attributes)
                attributes[attribute] = await this.loadAccessor(primitive.attributes[attribute]);

            const geometry = new GeometryData(new PrimitiveData(attributes, 4, await this.loadAccessor(primitive.indices!)));
            primitiveNode.data.push(geometry);
        }
        return meshNode;
    }

    private async loadNode(nodeName: string): Promise<TreeNode> {
        if (!this._content.nodes![nodeName]) this._logger.error('Node not available')
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
        if (!this._content.scene) this._logger.error('No scene')
        if (!this._content.scenes![this._content.scene!]) this._logger.error('Scene not available')
        const scene = this._content.scenes![this._content.scene!];
        const sceneDef = new TreeNode(this._content.scene!);
        for (let i = 0, len = scene.nodes!.length; i < len; i++)
            sceneDef.addChild(await this.loadNode(scene.nodes![i]));
        return sceneDef;
    }

    // #endregion Private Methods (6)
}