import { AttributeData } from '@shapediver/viewer.shared.types'
import {
  ACCESSORCOMPONENTTYPE_V2 as ACCESSOR_COMPONENTTYPE,
  ACCESSORTYPE_V2 as ACCESSORTYPE,
  IGLTF_v2,
  IGLTF_v2_Material,
  IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness,
  IGLTF_v2_Primitive,
  ISHAPEDIVER_materials_preset,
} from '@shapediver/viewer.data-engine.shared-types'
import { Logger, LOGGING_TOPIC } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { BufferLoader } from './BufferLoader'
import { BufferViewLoader } from './BufferViewLoader'

export class AccessorLoader {
  // #region Properties (2)

  private readonly _logger: Logger = <Logger>container.resolve(Logger);

  private _loaded: {
        [key: string]: AttributeData | null
    } = {};

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(private readonly _content: IGLTF_v2, private readonly _bufferViewLoader: BufferViewLoader) { }

  // #endregion Constructors (1)

  // #region Public Methods (2)

  public getAccessor(accessorId: number): AttributeData | null {
        if (!this._content.accessors) throw new Error('AccessorLoader.getAccessor: Accessors not available.')
        if (!this._content.accessors[accessorId]) throw new Error('AccessorLoader.getAccessor: Accessor not available.')
        if (!this._loaded[accessorId]) throw new Error('AccessorLoader.getAccessor: Accessor not loaded.')
        return this._loaded[accessorId];
    }

  public load(): void {
        if (!this._content.accessors) return;
        for (let i = 0; i < this._content.accessors.length; i++) {
            const accessorId = i;
            if (!this._content.accessors[accessorId]) throw new Error('AccessorLoader.load: BufferView not available.')
            const accessor = this._content.accessors[accessorId];

            if (accessor.bufferView === undefined) {
                // Ignore empty accessors, which may be used to declare runtime
                // information about attributes coming from another source (e.g. Draco
                // compression extension).
                this._loaded[accessorId] = null;
                continue;
            }

            const arrayBuffer = this._bufferViewLoader.getBufferView(accessor.bufferView!);

            const itemSize = ACCESSORTYPE[<keyof typeof ACCESSORTYPE>accessor.type];
            if (accessor.componentType === 5124) this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'GLTFLoader.loadAccessor: The componentType for this accessor is 5124, which is not allowed. Trying to load it anyway.');
            const ArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.componentType];

            const elementBytes = ArrayType.BYTES_PER_ELEMENT;
            const itemBytes = elementBytes * itemSize;
            const byteOffset = accessor.byteOffset || 0;
            const byteStride = accessor.bufferView !== undefined ? this._content.bufferViews ? this._content.bufferViews[accessor.bufferView].byteStride : undefined : undefined;
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

            if (normalized) {
                const scale = this.getNormalizedComponentScale(ArrayType);
                const scaled = new Float32Array(array.length);
                for (let j = 0, jl = array.length; j < jl; j++)
                    scaled[j] = array[j] * scale;
                array = scaled;
            }

            if (accessor.sparse !== undefined) {
                const itemSizeIndices = ACCESSORTYPE.SCALAR;
                const IndicesArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.sparse.indices.componentType];

                const byteOffsetIndices = accessor.sparse.indices.byteOffset || 0;
                const byteOffsetValues = accessor.sparse.values.byteOffset || 0;

                if (!accessor.sparse.indices.bufferView || !accessor.sparse.values.bufferView) throw new Error('Sparse Mesh not properly defined.')

                const sparseIndices = new IndicesArrayType(this._bufferViewLoader.getBufferView(accessor.sparse.indices.bufferView!), byteOffsetIndices, accessor.sparse.count * itemSizeIndices);
                const sparseValues = new ArrayType(this._bufferViewLoader.getBufferView(accessor.sparse.values.bufferView!), byteOffsetValues, accessor.sparse.count * itemSize);

                this._loaded[accessorId] = new AttributeData(array, itemSize, itemBytes, byteOffset, elementBytes, normalized, accessor.count, accessor.min, accessor.max, byteStride, true, sparseIndices, sparseValues);
                continue;
            }

            this._loaded[accessorId] = new AttributeData(array, itemSize, itemBytes, byteOffset, elementBytes, normalized, accessor.count, accessor.min, accessor.max, byteStride);
        }
    }

  // #endregion Public Methods (2)

  // #region Private Methods (1)

  private getNormalizedComponentScale(constructor: Uint8ArrayConstructor | Int8ArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor) {
        // Reference:
        // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

        switch (constructor) {
            case Int8Array:
                return 1 / 127;

            case Uint8Array:
                return 1 / 255;

            case Int16Array:
                return 1 / 32767;

            case Uint16Array:
                return 1 / 65535;

            default:
                throw new Error('THREE.GLTFLoader: Unsupported normalized accessor component type.');
        }
    }

  // #endregion Private Methods (1)
}
