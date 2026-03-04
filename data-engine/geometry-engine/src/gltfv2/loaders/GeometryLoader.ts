import {
	IGLTF_v2,
	IGLTF_v2_Primitive,
} from "@shapediver/viewer.data-engine.shared-types";
import {Logger} from "@shapediver/viewer.shared.services";
import {
	AttributeData,
	GeometryData,
	IMapData,
	IMaterialAbstractData,
	MapData,
	MaterialVariantsData,
	PrimitiveData,
} from "@shapediver/viewer.shared.types";
import {GLTF_EXTENSIONS} from "../GLTFLoader";
import {AccessorLoader} from "./AccessorLoader";
import {BufferViewLoader} from "./BufferViewLoader";
import {MaterialLoader} from "./MaterialLoader";

export class GeometryLoader {
	// #region Properties (1)

	private readonly _logger: Logger = Logger.instance;
	private readonly _attributeNameCache = new Map<string, string>();
	private readonly _digitRegex = /\d/;
	private _dracoDecoder: any = null;

	private _materialVariantsData = new MaterialVariantsData();
	private _loaded: {
		[key: string]: GeometryData;
	} = {};

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(
		private readonly _content: IGLTF_v2,
		private readonly _accessorLoader: AccessorLoader,
		private readonly _bufferViewLoader: BufferViewLoader,
		private readonly _materialLoader: MaterialLoader,
		private readonly _dracoModule: any,
	) {}

	// #endregion Constructors (1)

	// #region Public Accessors (1)

	public get materialVariantsData(): MaterialVariantsData {
		return this._materialVariantsData;
	}

	// #endregion Public Accessors (1)

	// #region Public Methods (1)

	public loadMesh(meshId: number, weights?: number[]): GeometryData[] {
		if (!this._content.meshes)
			throw new Error("GeometryLoader.loadMesh: Meshes not available.");
		if (!this._content.meshes[meshId])
			throw new Error("GeometryLoader.loadMesh: Mesh not available.");

		const mesh = this._content.meshes[meshId];

		const geometryDataArray: GeometryData[] = [];
		if (mesh.primitives) {
			const primitiveCount = mesh.primitives.length;
			for (let i = 0; i < primitiveCount; i++) {
				const geometryData = this.loadPrimitive(
					meshId,
					mesh.primitives,
					i,
					mesh.weights || weights,
				);
				if (geometryData) geometryDataArray.push(geometryData);
			}
		}
		return geometryDataArray;
	}

	// #endregion Public Methods (1)

	// #region Private Methods (1)

	/**
	 * Check if the material has maps defined and if so, if there are texture coordinates available. If not, remove all maps from the material.
	 * Otherwise, return the material as is.
	 *
	 * @param attributes
	 * @param material
	 * @returns
	 */
	private cleanMaterial(
		attributes: {[key: string]: AttributeData},
		material: IMaterialAbstractData | null,
	): IMaterialAbstractData | null {
		if (!material) return null;

		// Check for texture coordinates first (most common case)
		let hasTexCoords = false;
		for (const key in attributes) {
			if (key.includes("TEXCOORD")) {
				hasTexCoords = true;
				break;
			}
		}

		if (hasTexCoords) return material; // Fast path - everything is fine

		// Check if material has maps and remove them if needed (single iteration)
		let hasMaps = false;
		const mapsToRemove: (keyof IMaterialAbstractData)[] = [];
		for (const key in material) {
			if (
				material[key as keyof IMaterialAbstractData] instanceof MapData
			) {
				hasMaps = true;
				mapsToRemove.push(key as keyof IMaterialAbstractData);
			}
		}

		if (!hasMaps) return material; // No maps to clean

		// Only clone and remove maps if necessary
		this._logger.warn(
			"GeometryLoader.loadPrimitive: Material has maps but no texture coordinates are defined. Removing all maps from material.",
		);
		const assignedMaterial = material.clone();
		for (const key of mapsToRemove) {
			(assignedMaterial[key] as IMapData | undefined) = undefined;
		}

		return assignedMaterial;
	}

	private loadPrimitive(
		meshId: number,
		primitives: IGLTF_v2_Primitive[],
		index: number,
		weights: number[] = [],
	): GeometryData | undefined {
		const primitive = primitives[index];

		// Check cache first - important for scenes with many instances of same mesh
		const cacheKey = "mesh_" + meshId + "_primitive_" + index;
		if (this._loaded[cacheKey]) {
			return this._loaded[cacheKey];
		}

		const attributes: {
			[key: string]: AttributeData;
		} = {};

		let indices = null;
		const convertedNames: {[key: string]: string} = {};

		if (
			primitive.extensions &&
			primitive.extensions[GLTF_EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
		) {
			const dracoDef =
				primitive.extensions[
					GLTF_EXTENSIONS.KHR_DRACO_MESH_COMPRESSION
				];
			const arrayBuffer = this._bufferViewLoader.getBufferView(
				dracoDef.bufferView!,
			);

			// Reuse decoder to avoid overhead of creating new instance for each primitive
			if (!this._dracoDecoder) {
				this._dracoDecoder = new this._dracoModule.Decoder();
			}
			const decoder = this._dracoDecoder;
			const array = new Int8Array(arrayBuffer);
			const geometryType = decoder.GetEncodedGeometryType(array);

			let dracoGeometry;
			if (geometryType === this._dracoModule.TRIANGULAR_MESH) {
				dracoGeometry = new this._dracoModule.Mesh();
				decoder.DecodeArrayToMesh(
					array,
					array.byteLength,
					dracoGeometry,
				);
			} else if (geometryType === this._dracoModule.POINT_CLOUD) {
				dracoGeometry = new this._dracoModule.PointCloud();
				decoder.DecodeArrayToPointCloud(
					array,
					array.byteLength,
					dracoGeometry,
				);
			}

			if (dracoDef.attributes["POSITION"] === undefined) {
				const errorMsg = "No position attribute found in the mesh.";
				this._dracoModule.destroy(dracoGeometry);
				throw new Error(errorMsg);
			}

			for (const a in dracoDef.attributes) {
				const attribute = decoder.GetAttributeByUniqueId(
					dracoGeometry,
					dracoDef.attributes[a],
				);
				const attributeData = new this._dracoModule.DracoFloat32Array();
				decoder.GetAttributeFloatForAllPoints(
					dracoGeometry,
					attribute,
					attributeData,
				);

				const byteOffset = attribute.byte_offset();
				const normalized = attribute.normalized();
				const numComponents = attribute.num_components();

				const numPoints = dracoGeometry.num_points();
				const numValues = numPoints * numComponents;
				const byteLength = numValues * Float32Array.BYTES_PER_ELEMENT;

				const ptr = this._dracoModule._malloc(byteLength);
				decoder.GetAttributeDataArrayForAllPoints(
					dracoGeometry,
					attribute,
					this._dracoModule.DT_FLOAT32,
					byteLength,
					ptr,
				);
				const array = new Float32Array(
					this._dracoModule.HEAPF32.buffer,
					ptr,
					numValues,
				).slice();
				this._dracoModule._free(ptr);

				if (a.includes("COLOR"))
					array.forEach(
						(n, i) => (array[i] = Math.max(0, Math.min(1, n))),
					);

				attributes[a] = new AttributeData(
					array,
					numComponents, // itemSize
					array.BYTES_PER_ELEMENT * numComponents, // itemBytes = elementBytes * itemSize
					byteOffset, // byteOffset
					array.BYTES_PER_ELEMENT, // elementBytes
					normalized, // normalized
					array.length / numComponents,
				);
			}

			if (geometryType == this._dracoModule.TRIANGULAR_MESH) {
				const numFaces = dracoGeometry.num_faces();
				const numIndices = numFaces * 3;
				const byteLength = numIndices * 4;

				const ptr = this._dracoModule._malloc(byteLength);
				decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
				const indexArray = new Uint32Array(
					this._dracoModule.HEAPF32.buffer,
					ptr,
					numIndices,
				).slice();
				this._dracoModule._free(ptr);

				indices = new AttributeData(
					indexArray,
					1, // itemSize
					indexArray.BYTES_PER_ELEMENT * 1, // itemBytes = elementBytes * itemSize
					0, // byteOffset
					indexArray.BYTES_PER_ELEMENT, // elementBytes
					false, // normalized
					indexArray.length, // count
				);
			}

			// Keep decoder alive for reuse, only destroy geometry
			this._dracoModule.destroy(dracoGeometry);
		}

		for (const attribute in primitive.attributes) {
			if (attributes[attribute]) {
				convertedNames[attribute] = attribute;
				continue;
			}

			// Check cache first for attribute name conversion
			let attributeName = this._attributeNameCache.get(attribute);
			if (!attributeName) {
				attributeName = attribute;
				// attribute name conversion to be consistent with gltf
				if (
					this._digitRegex.test(attributeName) &&
					!attributeName.includes("_")
				) {
					const index = attributeName.search(this._digitRegex);
					attributeName =
						attributeName.substring(0, index) +
						"_" +
						attributeName.substring(index, attributeName.length);
				} else if (
					attributeName === "TEXCOORD" ||
					attributeName === "COLOR" ||
					attributeName === "JOINTS" ||
					attributeName === "WEIGHTS"
				) {
					attributeName += "_0";
				} else if (attributeName === "UV") {
					attributeName = "TEXCOORD_0";
				}
				this._attributeNameCache.set(attribute, attributeName);
			}

			convertedNames[attribute] = attributeName;
			const accessor = this._accessorLoader.getAccessor(
				primitive.attributes[attribute],
			);
			if (accessor) attributes[attributeName] = accessor;
		}

		if ((primitive.indices || primitive.indices === 0) && !indices) {
			const accessor = this._accessorLoader.getAccessor(
				primitive.indices,
			);
			if (accessor) indices = accessor;
		}

		// reading and assigning morph targets
		if (primitive.targets) {
			for (let i = 0; i < primitive.targets.length; i++) {
				for (const target in primitive.targets[i]) {
					if (!attributes[target]) continue;
					const accessor = this._accessorLoader.getAccessor(
						primitive.targets[i][target],
					);
					if (accessor)
						attributes[
							convertedNames[target]
						].morphAttributeData.push(accessor);
				}
			}
		}

		let material = null;
		if (primitive.material || primitive.material === 0)
			material = this._materialLoader.getMaterial(primitive.material);

		// if there are no attributes, return a primitive node without geometry data
		if (Object.values(attributes).length === 0) {
			this._logger.warn(
				"GeometryLoader.loadPrimitive: No attributes found. Primitive will be ignored.",
			);
			return;
		}

		// check if the material has maps defined and if so, if there are texture coordinates available
		const assignedMaterial = this.cleanMaterial(attributes, material);

		const primitiveData = new PrimitiveData(attributes, indices);
		const geometryData = new GeometryData(
			primitiveData,
			primitive.mode,
			assignedMaterial,
		);

		if (
			primitive.extensions &&
			primitive.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS]
		) {
			this._materialVariantsData.geometryData.push(geometryData);
			const variantsExtension =
				primitive.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS];

			for (let i = 0; i < variantsExtension.mappings.length; i++) {
				const mapping = variantsExtension.mappings[i];
				const material = this._materialLoader.getMaterial(
					mapping.material,
				);
				for (let j = 0; j < mapping.variants.length; j++)
					geometryData.materialVariants.push({
						variant: mapping.variants[j],
						material,
					});
			}
		}

		geometryData.morphWeights = weights;
		this._loaded["mesh_" + meshId + "_primitive_" + index] = geometryData;

		return geometryData;
	}

	/**
	 * Clean up resources to free memory after loading is complete
	 */
	public cleanup(): void {
		if (this._dracoDecoder) {
			this._dracoModule.destroy(this._dracoDecoder);
			this._dracoDecoder = null;
		}
	}

	// #endregion Private Methods (1)
}
