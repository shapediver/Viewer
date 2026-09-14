import {
	AttributeData,
	GeometryData,
	MapData,
	MaterialVariantsData,
	PrimitiveData,
} from "@shapediver/viewer.shared.node-tree";
import {HashCreator, Logger} from "@shapediver/viewer.shared.services";
import {
	type IAttributeData,
	type IGLTF_v2,
	type IGLTF_v2_Node,
	type IGLTF_v2_Primitive,
	type IMapData,
	type IMaterialAbstractData,
} from "@shapediver/viewer.shared.types";
import {GLTF_EXTENSIONS} from "../GLTFLoader";
import {AccessorLoader} from "./AccessorLoader";
import {BufferViewLoader} from "./BufferViewLoader";
import {MaterialLoader} from "./MaterialLoader";

/**
 * A primitive acting as the shared-geometry source for baked-transform
 * instance extraction. Later primitives with the same transform-invariant
 * signature are verified against it vertex by vertex.
 */
interface BakedRepresentative {
	instanceContent: string;
	positions: Float32Array;
	normals?: Float32Array;
	centroid: [number, number, number];
	/** Vertex farthest from the centroid (first frame axis). */
	frameIndexA: number;
	/** Vertex with the largest component perpendicular to the first axis. */
	frameIndexB: number;
	maxDist: number;
}

export class GeometryLoader {
	// #region Properties (1)

	private readonly _hashCreator: HashCreator = HashCreator.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _attributeNameCache = new Map<string, string>();
	// Accessor bytes are hashed once per accessor; primitives sharing accessors
	// reuse the result instead of re-reading the same buffers.
	private readonly _accessorContentHashCache = new Map<
		number,
		string | undefined
	>();
	private readonly _meshNodeReferences = new Map<number, IGLTF_v2_Node[]>();
	// Keyed by the full instance-content description (not its hash), so that
	// adopting a previous primitive as an instance source is an exact match.
	private readonly _loadedByInstanceContent = new Map<string, GeometryData>();
	private readonly _positionInvariantsCache = new Map<
		number,
		string | undefined
	>();
	private readonly _bakedBuckets = new Map<string, BakedRepresentative[]>();
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
		private readonly _urlHash?: number,
	) {
		for (const node of this._content.nodes ?? []) {
			if (node.mesh === undefined) continue;
			let nodes = this._meshNodeReferences.get(node.mesh);
			if (!nodes) {
				nodes = [];
				this._meshNodeReferences.set(node.mesh, nodes);
			}
			nodes.push(node);
		}
	}

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
		attributes: {[key: string]: IAttributeData},
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

	private createAccessorContentHash(
		accessorId: number | undefined,
	): string | undefined {
		if (accessorId === undefined) return;
		if (this._accessorContentHashCache.has(accessorId))
			return this._accessorContentHashCache.get(accessorId);

		const hash = this.computeAccessorContentHash(accessorId);
		this._accessorContentHashCache.set(accessorId, hash);
		return hash;
	}

	private computeAccessorContentHash(accessorId: number): string | undefined {
		const accessor = this._accessorLoader.getAccessor(accessorId);
		if (!accessor) return;

		return JSON.stringify({
			array: this.createTypedArrayHash(accessor.array),
			byteOffset: accessor.byteOffset,
			byteStride: accessor.byteStride,
			count: accessor.count,
			elementBytes: accessor.elementBytes,
			itemBytes: accessor.itemBytes,
			itemSize: accessor.itemSize,
			normalized: accessor.normalized,
			sparse: accessor.sparse,
			sparseIndices: accessor.sparseIndices
				? this.createTypedArrayHash(accessor.sparseIndices)
				: undefined,
			sparseValues: accessor.sparseValues
				? this.createTypedArrayHash(accessor.sparseValues)
				: undefined,
		});
	}

	private createTypedArrayHash(array: IAttributeData["array"]): string {
		const bytes = new Uint8Array(
			array.buffer,
			array.byteOffset,
			array.byteLength,
		);
		let hash = 2166136261;
		for (let i = 0; i < bytes.length; i++)
			hash = Math.imul(hash ^ bytes[i], 16777619);
		return `${array.constructor.name}:${array.length}:${hash >>> 0}`;
	}

	/** FNV-1a over the string, independent of the murmur hash it accompanies. */
	private createStringContentHash(content: string): number {
		let hash = 2166136261;
		for (let i = 0; i < content.length; i++)
			hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
		return hash >>> 0;
	}

	/**
	 * The accessor's array if it is usable for baked-transform extraction:
	 * densely packed float32 without sparse substitution or normalization.
	 */
	private getExtractableArray(
		accessorId: number | undefined,
		itemSize: number,
	): Float32Array | undefined {
		if (accessorId === undefined) return;
		const accessor = this._accessorLoader.getAccessor(accessorId);
		if (!accessor) return;
		if (!(accessor.array instanceof Float32Array)) return;
		if (accessor.sparse) return;
		if (accessor.normalized) return;
		if (
			accessor.byteStride !== undefined &&
			accessor.byteStride !== 0 &&
			accessor.byteStride !== accessor.itemBytes
		)
			return;
		if (accessor.itemSize !== itemSize) return;
		if (accessor.array.length !== accessor.count * itemSize) return;
		return accessor.array;
	}

	private createPositionInvariants(
		accessorId: number | undefined,
	): string | undefined {
		if (accessorId === undefined) return;
		if (this._positionInvariantsCache.has(accessorId))
			return this._positionInvariantsCache.get(accessorId);
		const invariants = this.computePositionInvariants(accessorId);
		this._positionInvariantsCache.set(accessorId, invariants);
		return invariants;
	}

	private computePositionInvariants(accessorId: number): string | undefined {
		const positions = this.getExtractableArray(accessorId, 3);
		if (!positions || positions.length < 9) return;

		const centroid = this.computeCentroid(positions);
		const count = positions.length / 3;
		let sum = 0;
		let sumSq = 0;
		let max = 0;
		for (let i = 0; i < positions.length; i += 3) {
			const dx = positions[i] - centroid[0];
			const dy = positions[i + 1] - centroid[1];
			const dz = positions[i + 2] - centroid[2];
			const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
			sum += d;
			sumSq += d * d;
			if (d > max) max = d;
		}
		if (max <= 0) return;

		// Quantized coarsely so that float noise from baking cannot split
		// buckets; a boundary split only costs a missed batching opportunity.
		const mean = sum / count;
		const rms = Math.sqrt(sumSq / count);
		return JSON.stringify({
			count,
			max: Number(max.toPrecision(4)),
			meanRatio: Math.round((mean / max) * 1000),
			rmsRatio: Math.round((rms / max) * 1000),
		});
	}

	private computeCentroid(positions: Float32Array): [number, number, number] {
		let x = 0;
		let y = 0;
		let z = 0;
		for (let i = 0; i < positions.length; i += 3) {
			x += positions[i];
			y += positions[i + 1];
			z += positions[i + 2];
		}
		const count = positions.length / 3;
		return [x / count, y / count, z / count];
	}

	/**
	 * Register a fully parsed primitive as a potential shared-geometry source
	 * for later baked-transform copies.
	 */
	private registerBakedRepresentative(
		bakedSignature: string,
		instanceContent: string,
		primitive: IGLTF_v2_Primitive,
	): void {
		const positions = this.getExtractableArray(
			primitive.attributes.POSITION,
			3,
		);
		if (!positions) return;
		const normals = this.getExtractableArray(
			primitive.attributes.NORMAL,
			3,
		);
		if (primitive.attributes.NORMAL !== undefined && !normals) return;

		const centroid = this.computeCentroid(positions);
		let frameIndexA = -1;
		let maxDistSq = 0;
		for (let i = 0; i < positions.length; i += 3) {
			const dx = positions[i] - centroid[0];
			const dy = positions[i + 1] - centroid[1];
			const dz = positions[i + 2] - centroid[2];
			const dSq = dx * dx + dy * dy + dz * dz;
			if (dSq > maxDistSq) {
				maxDistSq = dSq;
				frameIndexA = i / 3;
			}
		}
		if (frameIndexA < 0 || maxDistSq <= 0) return;
		const maxDist = Math.sqrt(maxDistSq);

		const a1x = positions[frameIndexA * 3] - centroid[0];
		const a1y = positions[frameIndexA * 3 + 1] - centroid[1];
		const a1z = positions[frameIndexA * 3 + 2] - centroid[2];
		const e1x = a1x / maxDist;
		const e1y = a1y / maxDist;
		const e1z = a1z / maxDist;
		let frameIndexB = -1;
		let maxRejectionSq = 0;
		for (let i = 0; i < positions.length; i += 3) {
			const vx = positions[i] - centroid[0];
			const vy = positions[i + 1] - centroid[1];
			const vz = positions[i + 2] - centroid[2];
			const dot = vx * e1x + vy * e1y + vz * e1z;
			const rx = vx - dot * e1x;
			const ry = vy - dot * e1y;
			const rz = vz - dot * e1z;
			const rejectionSq = rx * rx + ry * ry + rz * rz;
			if (rejectionSq > maxRejectionSq) {
				maxRejectionSq = rejectionSq;
				frameIndexB = i / 3;
			}
		}
		// Collinear geometry has no stable frame.
		if (frameIndexB < 0 || Math.sqrt(maxRejectionSq) < maxDist * 1e-5)
			return;

		let bucket = this._bakedBuckets.get(bakedSignature);
		if (!bucket) {
			bucket = [];
			this._bakedBuckets.set(bakedSignature, bucket);
		}
		bucket.push({
			instanceContent,
			positions,
			normals,
			centroid,
			frameIndexA,
			frameIndexB,
			maxDist,
		});
	}

	/**
	 * Try to explain this primitive as a rigid transform of an earlier one
	 * with the same transform-invariant signature.
	 */
	private tryExtractBakedInstance(
		primitive: IGLTF_v2_Primitive,
		bakedSignature: string,
	): {instanceContent: string; offsetMatrix: number[]} | undefined {
		const bucket = this._bakedBuckets.get(bakedSignature);
		if (!bucket || bucket.length === 0) return;

		const positions = this.getExtractableArray(
			primitive.attributes.POSITION,
			3,
		);
		if (!positions) return;
		const normals = this.getExtractableArray(
			primitive.attributes.NORMAL,
			3,
		);
		if (primitive.attributes.NORMAL !== undefined && !normals) return;

		const centroid = this.computeCentroid(positions);
		for (const representative of bucket) {
			if (representative.positions.length !== positions.length) continue;
			if (
				(representative.normals === undefined) !==
				(normals === undefined)
			)
				continue;
			const offsetMatrix = this.deriveRigidTransform(
				representative,
				positions,
				normals,
				centroid,
			);
			if (offsetMatrix)
				return {
					instanceContent: representative.instanceContent,
					offsetMatrix,
				};
		}
		return;
	}

	/**
	 * Derive the rigid transform (rotation + translation) mapping the
	 * representative's vertices onto this primitive's vertices, verifying
	 * every vertex (and normal). Returns a column-major 4x4 matrix, or
	 * undefined when the primitives are not rigid copies of each other.
	 * Reflections are rejected: both frames are built right-handed, so a
	 * mirrored copy fails the vertex verification.
	 */
	private deriveRigidTransform(
		representative: BakedRepresentative,
		positions: Float32Array,
		normals: Float32Array | undefined,
		centroid: [number, number, number],
	): number[] | undefined {
		const repPositions = representative.positions;
		const repCentroid = representative.centroid;
		const iA = representative.frameIndexA * 3;
		const iB = representative.frameIndexB * 3;
		const tolerance = representative.maxDist * 1e-4 + 1e-7;

		const va1: [number, number, number] = [
			repPositions[iA] - repCentroid[0],
			repPositions[iA + 1] - repCentroid[1],
			repPositions[iA + 2] - repCentroid[2],
		];
		const va2: [number, number, number] = [
			repPositions[iB] - repCentroid[0],
			repPositions[iB + 1] - repCentroid[1],
			repPositions[iB + 2] - repCentroid[2],
		];
		const vb1: [number, number, number] = [
			positions[iA] - centroid[0],
			positions[iA + 1] - centroid[1],
			positions[iA + 2] - centroid[2],
		];
		const vb2: [number, number, number] = [
			positions[iB] - centroid[0],
			positions[iB + 1] - centroid[1],
			positions[iB + 2] - centroid[2],
		];

		// Rigid transforms preserve lengths; cheap early exit.
		const length = (v: [number, number, number]) =>
			Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
		if (
			Math.abs(length(va1) - length(vb1)) > tolerance ||
			Math.abs(length(va2) - length(vb2)) > tolerance
		)
			return;

		const frameA = this.buildOrthonormalFrame(va1, va2);
		const frameB = this.buildOrthonormalFrame(vb1, vb2);
		if (!frameA || !frameB) return;

		// rotation = frameB * frameAᵀ, row-major 3x3
		const r = new Array<number>(9);
		for (let row = 0; row < 3; row++)
			for (let col = 0; col < 3; col++)
				r[row * 3 + col] =
					frameB[0][row] * frameA[0][col] +
					frameB[1][row] * frameA[1][col] +
					frameB[2][row] * frameA[2][col];
		const t = [
			centroid[0] -
				(r[0] * repCentroid[0] +
					r[1] * repCentroid[1] +
					r[2] * repCentroid[2]),
			centroid[1] -
				(r[3] * repCentroid[0] +
					r[4] * repCentroid[1] +
					r[5] * repCentroid[2]),
			centroid[2] -
				(r[6] * repCentroid[0] +
					r[7] * repCentroid[1] +
					r[8] * repCentroid[2]),
		];

		const toleranceSq = tolerance * tolerance;
		for (let i = 0; i < positions.length; i += 3) {
			const ax = repPositions[i];
			const ay = repPositions[i + 1];
			const az = repPositions[i + 2];
			const dx = r[0] * ax + r[1] * ay + r[2] * az + t[0] - positions[i];
			const dy =
				r[3] * ax + r[4] * ay + r[5] * az + t[1] - positions[i + 1];
			const dz =
				r[6] * ax + r[7] * ay + r[8] * az + t[2] - positions[i + 2];
			if (dx * dx + dy * dy + dz * dz > toleranceSq) return;
		}

		if (normals && representative.normals) {
			const repNormals = representative.normals;
			// unit vectors: 5e-3 ≈ 0.3° of angular error
			const normalToleranceSq = 25e-6;
			for (let i = 0; i < normals.length; i += 3) {
				const nx = repNormals[i];
				const ny = repNormals[i + 1];
				const nz = repNormals[i + 2];
				const dx = r[0] * nx + r[1] * ny + r[2] * nz - normals[i];
				const dy = r[3] * nx + r[4] * ny + r[5] * nz - normals[i + 1];
				const dz = r[6] * nx + r[7] * ny + r[8] * nz - normals[i + 2];
				if (dx * dx + dy * dy + dz * dz > normalToleranceSq) return;
			}
		}

		// column-major 4x4
		return [
			r[0],
			r[3],
			r[6],
			0,
			r[1],
			r[4],
			r[7],
			0,
			r[2],
			r[5],
			r[8],
			0,
			t[0],
			t[1],
			t[2],
			1,
		];
	}

	/** Right-handed orthonormal frame from two non-parallel vectors. */
	private buildOrthonormalFrame(
		v1: [number, number, number],
		v2: [number, number, number],
	):
		| [
				[number, number, number],
				[number, number, number],
				[number, number, number],
		  ]
		| undefined {
		const l1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
		if (l1 <= 0) return;
		const e1: [number, number, number] = [
			v1[0] / l1,
			v1[1] / l1,
			v1[2] / l1,
		];
		const dot = v2[0] * e1[0] + v2[1] * e1[1] + v2[2] * e1[2];
		const ux = v2[0] - dot * e1[0];
		const uy = v2[1] - dot * e1[1];
		const uz = v2[2] - dot * e1[2];
		const lu = Math.sqrt(ux * ux + uy * uy + uz * uz);
		if (lu <= l1 * 1e-8) return;
		const e2: [number, number, number] = [ux / lu, uy / lu, uz / lu];
		const e3: [number, number, number] = [
			e1[1] * e2[2] - e1[2] * e2[1],
			e1[2] * e2[0] - e1[0] * e2[2],
			e1[0] * e2[1] - e1[1] * e2[0],
		];
		return [e1, e2, e3];
	}

	private canPrimitiveBeInstanced(
		meshId: number,
		primitive: IGLTF_v2_Primitive,
	):
		| {
				instanceHash: string;
				instanceContent: string;
				instance?: GeometryData;
				bakedSignature?: string;
		  }
		| undefined {
		// InstancedMesh is currently only safe for static triangle primitives.
		// Morph targets, skinning, and material variants require per-node state
		// that the instance-group renderer does not provide yet.
		if ((primitive.mode ?? 4) !== 4) return;
		// EXT_mesh_gpu_instancing replicates the mesh via per-node instance
		// matrices. The batching path only applies the node transform, so it
		// would collapse those replicas into a single copy. A mesh referenced
		// by several plain nodes is fine: every referencing tree node
		// registers its own occurrence with its own transform.
		const meshNodes = this._meshNodeReferences.get(meshId) ?? [];
		if (
			meshNodes.some(
				(meshNode) =>
					meshNode.extensions &&
					meshNode.extensions[
						GLTF_EXTENSIONS.EXT_MESH_GPU_INSTANCING
					],
			)
		)
			return;
		if (primitive.targets && primitive.targets.length > 0) return;
		if (
			primitive.attributes.JOINTS_0 !== undefined ||
			primitive.attributes.WEIGHTS_0 !== undefined
		)
			return;
		if (
			primitive.extensions &&
			primitive.extensions[GLTF_EXTENSIONS.KHR_MATERIALS_VARIANTS]
		)
			return;
		if (
			primitive.material !== undefined &&
			this._content.materials &&
			this._content.materials[primitive.material]
		) {
			const material = this._content.materials[primitive.material];
			const alpha = material.pbrMetallicRoughness?.baseColorFactor?.[3];
			if (material.alphaMode && material.alphaMode !== "OPAQUE") return;
			if (alpha !== undefined && alpha !== 1) return;
		}

		let materialContent = "";
		if (
			primitive.material !== undefined &&
			this._content.materials &&
			this._content.materials[primitive.material]
		) {
			const materialWithoutBaseColorFactor = {
				...this._content.materials[primitive.material],
			};
			// The material name is cosmetic; it must not split instance groups.
			delete materialWithoutBaseColorFactor.name;
			if (materialWithoutBaseColorFactor.pbrMetallicRoughness) {
				materialWithoutBaseColorFactor.pbrMetallicRoughness = {
					...materialWithoutBaseColorFactor.pbrMetallicRoughness,
					// ignore base color factor for instance hashing
					baseColorFactor: undefined,
				};
			}
			materialContent = JSON.stringify(materialWithoutBaseColorFactor);
		}

		const attributes = Object.fromEntries(
			Object.keys(primitive.attributes)
				.sort()
				.map((name) => [
					name,
					this.createAccessorContentHash(primitive.attributes[name]),
				]),
		);
		if (Object.values(attributes).some((hash) => hash === undefined))
			return;

		const instanceContent = JSON.stringify({
			attributes,
			extensions: primitive.extensions,
			indices: this.createAccessorContentHash(primitive.indices),
			material: materialContent,
			mode: primitive.mode,
		});

		// Two independent 32-bit hashes: render batches are grouped by this key,
		// so a collision would silently draw the wrong geometry. A single 32-bit
		// hash gets risky for scenes with many unique primitives.
		const geometryHash =
			this._hashCreator.createMurmurHash(instanceContent) +
			"_" +
			this.createStringContentHash(instanceContent);
		const instanceHash =
			this._urlHash !== undefined
				? this._urlHash + "_" + geometryHash
				: geometryHash;

		// Check whether a previous primitive has the same geometry and material.
		const instance = this._loadedByInstanceContent.get(instanceContent);

		// Signature that is invariant under rigid transforms baked into the
		// vertex data: everything but the POSITION/NORMAL bytes, plus geometric
		// invariants of the positions. Primitives sharing it are candidates for
		// baked-transform instance extraction.
		let bakedSignature: string | undefined;
		if (primitive.attributes.TANGENT === undefined) {
			const positionInvariants = this.createPositionInvariants(
				primitive.attributes.POSITION,
			);
			if (positionInvariants !== undefined) {
				const invariantAttributes: {[key: string]: string | undefined} =
					{...attributes};
				delete invariantAttributes.POSITION;
				delete invariantAttributes.NORMAL;
				bakedSignature = JSON.stringify({
					attributes: invariantAttributes,
					extensions: primitive.extensions,
					hasNormals: primitive.attributes.NORMAL !== undefined,
					indices: this.createAccessorContentHash(primitive.indices),
					material: materialContent,
					mode: primitive.mode,
					positionInvariants,
				});
			}
		}

		return {instanceHash, instanceContent, instance, bakedSignature};
	}

	private addInstance(
		geometryData: GeometryData,
		cacheKey: string,
		material: IMaterialAbstractData | null,
		offsetMatrix?: number[],
	): GeometryData {
		if (geometryData.instantiable === false) {
			geometryData.instantiable = true;
			// White in the 0-255 scale the color converter expects for arrays.
			geometryData.instanceColors.push(
				geometryData.material && geometryData.material.color
					? geometryData.material.color
					: [255, 255, 255, 255],
			);
		}

		// The source geometry can be shared, but every primitive occurrence needs
		// its own scene-data identity. Otherwise the renderer cannot distinguish
		// matching primitives attached to the same glTF node.
		const instance = geometryData.clone() as GeometryData;
		instance.material = material;
		if (offsetMatrix) instance.instanceOffsetMatrix = offsetMatrix;
		instance.instanceColors = [
			material && material.color ? material.color : [255, 255, 255, 255],
		];
		this._loaded[cacheKey] = instance;
		return instance;
	}

	private loadPrimitive(
		meshId: number,
		primitives: IGLTF_v2_Primitive[],
		index: number,
		weights: number[] = [],
	): GeometryData | undefined {
		const primitive = primitives[index];
		const instancing = this.canPrimitiveBeInstanced(meshId, primitive);

		let material = null;
		if (primitive.material || primitive.material === 0)
			material = this._materialLoader.getMaterial(primitive.material);

		// Check cache first - important for scenes with many instances of same mesh
		const cacheKey = "mesh_" + meshId + "_primitive_" + index;
		if (this._loaded[cacheKey]) {
			if (instancing)
				return this.addInstance(
					this._loaded[cacheKey],
					cacheKey,
					material,
				);
			return this._loaded[cacheKey];
		}

		if (instancing?.instance)
			return this.addInstance(instancing.instance, cacheKey, material);

		// A primitive with a matching transform-invariant signature may be a
		// baked-transform copy of an earlier primitive: verify vertex by
		// vertex and, on success, share the earlier geometry plus an offset.
		if (instancing?.bakedSignature) {
			const extracted = this.tryExtractBakedInstance(
				primitive,
				instancing.bakedSignature,
			);
			const source = extracted
				? this._loadedByInstanceContent.get(extracted.instanceContent)
				: undefined;
			if (extracted && source) {
				const instance = this.addInstance(
					source,
					cacheKey,
					material,
					extracted.offsetMatrix,
				);
				// Byte-identical copies of THIS primitive found later reuse
				// the same source and offset.
				if (
					!this._loadedByInstanceContent.has(
						instancing.instanceContent,
					)
				)
					this._loadedByInstanceContent.set(
						instancing.instanceContent,
						instance,
					);
				return instance;
			}
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
			const dracoBufferView = this._bufferViewLoader.getBufferView(
				dracoDef.bufferView!,
			);

			// Reuse decoder to avoid overhead of creating new instance for each primitive
			if (!this._dracoDecoder) {
				this._dracoDecoder = new this._dracoModule.Decoder();
			}
			const decoder = this._dracoDecoder;
			const array = new Int8Array(
				dracoBufferView.buffer,
				dracoBufferView.byteOffset,
				dracoBufferView.byteLength,
			);
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
		geometryData.instanceHash = instancing?.instanceHash;
		this._loaded["mesh_" + meshId + "_primitive_" + index] = geometryData;
		if (
			instancing !== undefined &&
			!this._loadedByInstanceContent.has(instancing.instanceContent)
		) {
			this._loadedByInstanceContent.set(
				instancing.instanceContent,
				geometryData,
			);
			// This primitive is canonical for its content; it can also act as
			// the shared-geometry source for baked-transform copies.
			if (instancing.bakedSignature)
				this.registerBakedRepresentative(
					instancing.bakedSignature,
					instancing.instanceContent,
					primitive,
				);
		}

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
