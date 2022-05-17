import { IGLTF_v2, IGLTF_v2_Primitive } from '@shapediver/viewer.data-engine.shared-types'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { AttributeData, GeometryData, MaterialVariantsData, PrimitiveData } from '@shapediver/viewer.shared.types'

import { GLTF_EXTENSIONS } from '../GLTFLoader'
import { AccessorLoader } from './AccessorLoader'
import { BufferViewLoader } from './BufferViewLoader'
import { MaterialLoader } from './MaterialLoader'

export class GeometryLoader {
    // #region Properties (1)

    private _materialVariantsData = new MaterialVariantsData();

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private readonly _content: IGLTF_v2, 
        private readonly _accessorLoader: AccessorLoader, 
        private readonly _bufferViewLoader: BufferViewLoader, 
        private readonly _materialLoader: MaterialLoader,
        private readonly _dracoModule: any
    ) {}

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get materialVariantsData(): MaterialVariantsData {
        return this._materialVariantsData;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    public loadMesh(meshId: number, weights?: number[]): ITreeNode {
        if (!this._content.meshes) throw new Error('GeometryLoader.loadMesh: Meshes not available.')
        if (!this._content.meshes[meshId]) throw new Error('GeometryLoader.loadMesh: Mesh not available.')
        const mesh = this._content.meshes[meshId];
        const meshNode = new TreeNode(mesh.name || 'mesh_' + meshId);

        if (mesh.primitives)
            for (let i = 0, len = mesh.primitives.length; i < len; i++)
                meshNode.addChild(this.loadPrimitive(mesh.primitives, i, mesh.weights || weights));

        return meshNode;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private loadPrimitive(primitives: IGLTF_v2_Primitive[], index: number, weights: number[] = []): ITreeNode {
        const primitive = primitives[index];
        const primitiveNode = new TreeNode('primitive_' + index);

        const attributes: {
            [key: string]: AttributeData
        } = {};

        let indices = null;
        const convertedNames: { [key: string]: string } = {}

        if (primitive.extensions && primitive.extensions[GLTF_EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
            const dracoDef = primitive.extensions[GLTF_EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
            const arrayBuffer = this._bufferViewLoader.getBufferView(dracoDef.bufferView!);

            const decoder = new this._dracoModule.Decoder();
            const buffer = new this._dracoModule.DecoderBuffer();
            buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);
            const geometryType = decoder.GetEncodedGeometryType(buffer);

            let dracoGeometry;
            if (geometryType === this._dracoModule.TRIANGULAR_MESH) {
                dracoGeometry = new this._dracoModule.Mesh();
                decoder.DecodeBufferToMesh(buffer, dracoGeometry);
            } else if (geometryType === this._dracoModule.POINT_CLOUD) {
                dracoGeometry = new this._dracoModule.PointCloud();
                decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
            }
            this._dracoModule.destroy(buffer);

            if (dracoDef.attributes['POSITION'] === undefined) {
                const errorMsg = "No position attribute found in the mesh.";
                this._dracoModule.destroy(decoder);
                this._dracoModule.destroy(dracoGeometry);
                throw new Error(errorMsg);
            }

            for (let a in dracoDef.attributes) {
                const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, dracoDef.attributes[a])
                const attributeData = new this._dracoModule.DracoFloat32Array();
                decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);

                const byteOffset = attribute.byte_offset();
                const normalized = attribute.normalized();
                const num_components = attribute.num_components();
                const count = attributeData.size();

                const array = new Float32Array(count);

                for (let i = 0; i < count; i++) {
                    for (let a = 0; a < num_components; a++) {
                        const temp = i * num_components;
                        const value = attributeData.GetValue(temp + a);
                        array[temp + a] = value;
                    }
                }
                this._dracoModule.destroy(attributeData);

                attributes[a] = new AttributeData(
                    array,
                    num_components, // itemSize
                    array.BYTES_PER_ELEMENT * num_components, // itemBytes = elementBytes * itemSize
                    byteOffset, // byteOffset
                    array.BYTES_PER_ELEMENT, // elementBytes
                    normalized, // normalized
                    array.length / num_components
                );
            }

            const numFaces = geometryType == this._dracoModule.TRIANGULAR_MESH ? dracoGeometry.num_faces() : 0;
            const numIndices = numFaces * 3;
            const indexArray = new Uint32Array(numIndices);

            // For mesh, we need to generate the faces.
            if (geometryType == this._dracoModule.TRIANGULAR_MESH) {
                const ia = new this._dracoModule.DracoInt32Array();
                for (let i = 0; i < numFaces; ++i) {
                    decoder.GetFaceFromMesh(dracoGeometry, i, ia);
                    const index = i * 3;
                    indexArray[index] = ia.GetValue(0);
                    indexArray[index + 1] = ia.GetValue(1);
                    indexArray[index + 2] = ia.GetValue(2);
                }
                this._dracoModule.destroy(ia);
            }
            this._dracoModule.destroy(decoder);
            this._dracoModule.destroy(dracoGeometry);

            if (geometryType == this._dracoModule.TRIANGULAR_MESH)
                indices = new AttributeData(
                    indexArray,
                    1, // itemSize
                    indexArray.BYTES_PER_ELEMENT * 1, // itemBytes = elementBytes * itemSize
                    0, // byteOffset
                    indexArray.BYTES_PER_ELEMENT, // elementBytes
                    false, // normalized
                    indexArray.length // count
                );
        }

        for (let attribute in primitive.attributes) {
            if (attributes[attribute]) {
                convertedNames[attribute] = attribute;
                continue;
            }

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
            attributes[attributeName] = (this._accessorLoader.getAccessor(primitive.attributes[attribute]))!;
        }

        if ((primitive.indices || primitive.indices === 0) && !indices)
            indices = this._accessorLoader.getAccessor(primitive.indices);

        // reading and assigning morph targets
        if (primitive.targets) {
            for (let i = 0; i < primitive.targets.length; i++) {
                for (let target in primitive.targets[i]) {
                    if (!attributes[target]) continue;
                    attributes[convertedNames[target]].morphAttributeData.push((this._accessorLoader.getAccessor(primitive.targets[i][target]))!);
                }
            }
        }

        let material = null;
        if (primitive.material || primitive.material === 0) 
            material = this._materialLoader.getMaterial(primitive.material);

        const primitiveData = new PrimitiveData(attributes, primitive.mode, indices, material);

        if (primitive.extensions && primitive.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS]) {
            this._materialVariantsData.primitiveData.push(primitiveData);
            const variantsExtension = primitive.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS];

            for (let i = 0; i < variantsExtension.mappings.length; i++) {
                const mapping = variantsExtension.mappings[i];
                const material = this._materialLoader.getMaterial(mapping.material);
                for (let j = 0; j < mapping.variants.length; j++)
                    primitiveData.materialVariants.push({ variant: mapping.variants[j], material });
            }
        }

        const geometryData = new GeometryData(primitiveData);
        geometryData.morphWeights = weights;
        primitiveNode.data.push(geometryData);
        return primitiveNode;
    }

    // #endregion Private Methods (1)
}