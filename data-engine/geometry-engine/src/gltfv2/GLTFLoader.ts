import { TreeNode } from '@shapediver/viewer.shared.node-tree';
import { HttpClient, ImageLoader, UuidGenerator } from '@shapediver/viewer.shared.utils';
import { container } from 'tsyringe';

import { ACCESSOR_COMPONENTTYPE_V2 as ACCESSOR_COMPONENTTYPE, ACCESSORTYPE_V2 as ACCESSORTYPE, IGLTF_v2, IGLTF_v2_Material, IGLTF_v2_Primitive } from '@shapediver/viewer.data-engine.shared-types';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { AttributeData, GeometryData, MapData, MaterialData, MATERIAL_ALPHA, MATERIAL_SIDE, PrimitiveData } from '@shapediver/viewer.shared.types';

export class GLTFLoader {
    // #region Properties (6)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _httpClient = container.resolve(HttpClient);
    private readonly _imageLoader = container.resolve(ImageLoader);
    private readonly _uuidGenerator = container.resolve(UuidGenerator);

    private _baseUri!: string;
    private _body!: ArrayBuffer;
    private _content!: IGLTF_v2;

    // #endregion Properties (6)

    // #region Public Methods (1)

    public async load(url?: string | undefined): Promise<TreeNode> {
        console.log('init')
        const axiosResponse = await this._httpClient.get(url!, {
            responseType: 'arraybuffer'
        });

        // TODO handle error case

        const isBinary = axiosResponse.headers['content-type'] && 
            (axiosResponse.headers['content-type'] === 'model/gltf-binary' || 
            axiosResponse.headers['content-type'] === 'application/octet-stream' || 
            axiosResponse.headers['content-type'] === 'model/gltf.binary');

        if(isBinary) {
            console.log('binary')
            const binaryGeometry: ArrayBuffer = axiosResponse.data;
            // create header data
            const headerDataView = new DataView(binaryGeometry, 0, this.BINARY_EXTENSION_HEADER_LENGTH);
            const header = {
                magic: String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3)),
                version: headerDataView.getUint32(4, true),
                length: headerDataView.getUint32(8, true),
                contentLength: headerDataView.getUint32(12, true),
                contentFormat: headerDataView.getUint32(16, true)
            }
            if (header.magic != 'glTF') console.error('ShapeDiverGLBLoader got invalid data: glTF magic wrong.');
    
            // create content
            const contentDataView = new DataView(binaryGeometry, this.BINARY_EXTENSION_HEADER_LENGTH, header.contentLength);
            const contentDecoded = new TextDecoder().decode(contentDataView);
            this._content = JSON.parse(contentDecoded);
    
            // create body
            this._body = binaryGeometry.slice(this.BINARY_EXTENSION_HEADER_LENGTH + header.contentLength, header.length);
        } else {
            console.log('not binary')
            this._content = JSON.parse(new TextDecoder().decode(axiosResponse.data));

            const removeLastDirectoryPartOf = (the_url: string): string => {
                const dir_char = the_url.includes("/") ? "/" : "\\";
                const the_arr = the_url.split(dir_char);
                the_arr.pop();
                return the_arr.join(dir_char);
            }

            console.log(url)
            this._baseUri = removeLastDirectoryPartOf(url!);
            console.log(this._baseUri)
            if (!this._baseUri && window && window.location && window.location.href)
                this._baseUri = removeLastDirectoryPartOf(window.location.href);
                
            console.log(this._baseUri)
        }

        console.log(this._content)
        return await this.loadScene()
    }

    // #endregion Public Methods (1)

    // #region Private Methods (9)

    private async loadAccessor(accessorId: number): Promise<AttributeData> {
        if (!this._content.accessors![accessorId]) console.error('Accessor not available')
        const accessor = this._content.accessors![accessorId];
        const arrayBuffer = await this.loadBufferView(accessor.bufferView!);
        
        // @ts-ignore
        const itemSize = ACCESSORTYPE[accessor.type!];
        // @ts-ignore
        const ArrayType = ACCESSOR_COMPONENTTYPE[accessor.componentType!];
        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;

        var byteOffset = accessor.byteOffset || 0;
        var byteStride = accessor.bufferView !== undefined ? this._content.bufferViews[accessor.bufferView!].byteStride : undefined;
        var normalized = accessor.normalized === true;
        
        // The buffer is not interleaved if the stride is the item size in bytes. 
        if (byteStride && byteStride !== itemBytes) {
            var ibSlice = Math.floor( byteOffset / byteStride );
            return new AttributeData(new ArrayType( arrayBuffer, ibSlice * byteStride, accessor.count * byteStride / elementBytes ), itemSize, true, byteOffset! / elementBytes, byteStride! / elementBytes, normalized);
        } else {
            return new AttributeData(new ArrayType(arrayBuffer).slice(byteOffset / elementBytes, byteOffset / elementBytes + accessor.count * itemBytes / elementBytes), itemSize, false);
        }
    }

    private async loadBuffer(bufferId: number): Promise<ArrayBuffer> {
        if (!this._content.buffers![bufferId]) console.error('Buffer not available')
        const buffer = this._content.buffers![bufferId];

        if (!buffer.uri && bufferId === 0)
            return this._body;

            let result = await this._httpClient.get(this._baseUri + '/' + buffer.uri!, {
                responseType: 'arraybuffer'
            })

        return <ArrayBuffer> result.data;
    }

    private async loadBufferView(bufferViewId: number): Promise<ArrayBuffer> {
        if (!this._content.bufferViews![bufferViewId]) console.error('Buffer View not available')
        const bufferView = this._content.bufferViews![bufferViewId];
        const byteLength = bufferView.byteLength || 0;
        const byteOffset = bufferView.byteOffset || 0;
        const arrayBuffer: ArrayBuffer = (await this.loadBuffer(bufferView.buffer!)).slice(byteOffset, byteOffset + byteLength);
        return arrayBuffer;
    }

    private async loadMap(index: number): Promise<MapData> {
        let mapData: MapData;

        const texture = this._content.textures[index];
        const image = this._content.images[texture.source];
        const sampler = this._content.samplers[texture.source];

        const DATA_URI_REGEX = /^data:(.*?)(;base64)?,(.*)$/;
        const HTTPS_URI_REGEX = /^https:\/\//;

        if(image.bufferView !== undefined) {
            const bufferView = await this.loadBufferView(image.bufferView);
            const dataView = new DataView(bufferView);
            const array: Array<number> = [];
            for (let i = 0; i < dataView.byteLength; i += 1)
                array[i] = dataView.getUint8(i);

            const blob = new Blob([new Uint8Array(array)], { type: image.mimeType});
            const dataUri = window.URL.createObjectURL(blob);
            window.open(dataUri);
            mapData = new MapData(await this._imageLoader.load(dataUri!), sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter);
        } else {
            const url = DATA_URI_REGEX.test(image.uri!) || HTTPS_URI_REGEX.test(image.uri!) ? image.uri : `${this._baseUri}/${image.uri}`;
            mapData = new MapData(await this._imageLoader.load(url!), sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter);
        }
        return mapData;
    }

    private async loadMaterial(index: number): Promise<MaterialData> {
        const material: IGLTF_v2_Material = this._content.materials[index];
        const materialData = new MaterialData();
        if(material.name !== undefined) materialData.name = material.name;

        if(material.pbrMetallicRoughness !== undefined) {
            if(material.pbrMetallicRoughness.baseColorFactor !== undefined) {
                materialData.color = vec4.fromValues(material.pbrMetallicRoughness.baseColorFactor[0],
                    material.pbrMetallicRoughness.baseColorFactor[1],
                    material.pbrMetallicRoughness.baseColorFactor[2],
                    material.pbrMetallicRoughness.baseColorFactor[3]);
            }
            if(material.pbrMetallicRoughness.baseColorTexture !== undefined) {
                console.log(material.pbrMetallicRoughness.baseColorTexture)
                materialData.map = await this.loadMap(material.pbrMetallicRoughness.baseColorTexture.index);
            }
            if(material.pbrMetallicRoughness.metallicFactor !== undefined) {
                materialData.metalness = material.pbrMetallicRoughness.metallicFactor;
            }
            if(material.pbrMetallicRoughness.roughnessFactor !== undefined) {
                materialData.roughness = material.pbrMetallicRoughness.roughnessFactor;
            }
            if(material.pbrMetallicRoughness.metallicRoughnessTexture !== undefined) {
                materialData.metalnessRoughnessMap = await this.loadMap(material.pbrMetallicRoughness.metallicRoughnessTexture.index);
            }
        }

        if(material.normalTexture !== undefined) {
            materialData.normalMap = await this.loadMap(material.normalTexture.index);
        }
        if(material.occlusionTexture !== undefined) {        
            materialData.alphaMap = await this.loadMap(material.occlusionTexture.index);
        }
        if(material.emissiveTexture !== undefined) {
            materialData.emissiveMap = await this.loadMap(material.emissiveTexture.index);
        }

        if(material.emissiveFactor !== undefined) {
            materialData.emissiveness = vec3.fromValues(material.emissiveFactor[0], material.emissiveFactor[1], material.emissiveFactor[2]);
        }        
        if(material.alphaMode !== undefined) {
            materialData.alphaMode = material.alphaMode.toLowerCase() === MATERIAL_ALPHA.MASK ? MATERIAL_ALPHA.MASK : material.alphaMode.toLowerCase() === MATERIAL_ALPHA.BLEND ? MATERIAL_ALPHA.BLEND : MATERIAL_ALPHA.OPAQUE; 
        }      
        if(material.alphaCutoff !== undefined) {
            materialData.alphaCutoff = material.alphaCutoff;
        }     
        if(material.doubleSided !== undefined) {
            materialData.side = material.doubleSided ? MATERIAL_SIDE.DOUBLE : MATERIAL_SIDE.FRONT;
        }
        return materialData;
    }

    private async loadMesh(meshId: number): Promise<TreeNode> {
        if (!this._content.meshes || !this._content.meshes[meshId]) console.error('Mesh not available')
        const mesh = this._content.meshes[meshId];
        const meshNode = new TreeNode(mesh.name || 'mesh_' + meshId);

        if(mesh.primitives)
            for (let i = 0, len = mesh.primitives.length; i < len; i++)
                meshNode.addChild(await this.loadPrimitive(mesh.primitives, i));

        // TODO weights
        return meshNode;
    }

    private async loadNode(nodeId: number): Promise<TreeNode> {
        if (!this._content.nodes || !this._content.nodes[nodeId]) console.error('Node not available')
        const node = this._content.nodes[nodeId];
        const nodeDef = new TreeNode(node.name || 'node_' + nodeId);

        if (node.matrix) {
            nodeDef.transformations.push({
                id: this._uuidGenerator.create(),
                name: 'glTFNode_' + nodeId,
                matrix: mat4.fromValues(    node.matrix[0], node.matrix[1], node.matrix[2], node.matrix[3],
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

        if(node.mesh !== undefined)
            nodeDef.addChild(await this.loadMesh(node.mesh));
        
        if(node.children) {
            for (let i = 0, len = node.children.length; i < len; i++) {
                // got through all children
                nodeDef.addChild(await this.loadNode(node.children[i]));
            }
        }

        // TODO camera, skin, weights
        return nodeDef;
    }

    private async loadPrimitive(primitives: IGLTF_v2_Primitive[], index: number): Promise<TreeNode> {
        const primitive = primitives[index];
        const primitiveNode = new TreeNode('primitive_' + index);

        const attributes: {
            [key: string]: AttributeData
        } = {};

        for (let attribute in primitive.attributes)
            attributes[attribute] = await this.loadAccessor(primitive.attributes[attribute]);

        let indices = null;
        if(primitive.indices || primitive.indices === 0)
            indices = await this.loadAccessor(primitive.indices);

        let material = null;
        if(primitive.material || primitive.material === 0)
            material = await this.loadMaterial(primitive.material);
        
        primitiveNode.data.push(new GeometryData(new PrimitiveData(attributes, primitive.mode, indices, material)));
        console.log(primitiveNode)
        // TODO targets

        return primitiveNode;
    }

    private async loadScene(): Promise<TreeNode> {
        const sceneID = this._content.scene || 0;
        if (!this._content.scenes || !this._content.scenes[sceneID]) console.error('Scene not available')
        const scene = this._content.scenes[sceneID];
        const sceneDef = new TreeNode('scene_' + scene.name || sceneID +'');
        if(scene.nodes)
            for (let i = 0, len = scene.nodes.length; i < len; i++) 
                sceneDef.addChild(await this.loadNode(scene.nodes[i]));
        return sceneDef;
    }

    // #endregion Private Methods (9)
}