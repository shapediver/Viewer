import {
	AttributeData,
	GeometryData,
	MapData,
	MaterialVariantsData,
	PrimitiveData,
} from "@shapediver/viewer.shared.node-tree";
import {HashCreator, Logger} from "@shapediver/viewer.shared.services";
import {
	ACCESSORCOMPONENTSIZE_V2,
	ACCESSORTYPE_V2,
	type IAttributeData,
	type IGLTF_v2,
	type IGLTF_v2_Node,
	type IGLTF_v2_Primitive,
	type IMapData,
	type IMaterialAbstractData,
} from "@shapediver/viewer.shared.types";
import {hashTypedArray} from "../../hashTypedArray";
import {type IDecodedDracoPrimitive} from "../draco/DracoWorkerDecoder";
import {GLTF_EXTENSIONS} from "../GLTFLoader";
import {AccessorLoader} from "./AccessorLoader";
import {MaterialLoader} from "./MaterialLoader";

/**
 * A primitive acting as the shared-geometry source for baked-transform
 * instance extraction. Later primitives with the same transform-invariant
 * signature are verified against it vertex by vertex.
 */
interface BakedRepresentative {
	positions: Float32Array;
	normals?: Float32Array;
	centroid: [number, number, number];
	/** Vertex farthest from the centroid (first frame axis). */
	frameIndexA: number;
	/** Vertex with the largest component perpendicular to the first axis. */
	frameIndexB: number;
	maxDist: number;
}

/**
 * A previously loaded primitive that might later prove to be an instance
 * source. Byte hashing and baked-transform recovery run only when another
 * primitive shares this cheap fingerprint.
 */
interface PendingInstancing {
	primitive: IGLTF_v2_Primitive;
	geometryData: GeometryData;
	/** Insertion order; candidates are tried in this order. */
	sequence: number;
	/** Undefined when POSITION cannot be read; it then matches anything. */
	signature?: RigidSignature;
	contentHash?: string;
	staticContentHash?: string;
	bakedRep?: BakedRepresentative;
	/** Null when the accessor has no usable min/max. */
	bounds?: PositionBounds | null;
}

/**
 * Squared distances between a few corresponding vertex pairs. A rigid
 * transform keeps them, so they reject most non-copies without a walk.
 */
interface RigidSignature {
	positions: Float32Array;
	distances: number[];
	/** Computed when the primitive is first compared; null if not finite. */
	invariants?: AcceptInvariants | null;
}

/**
 * Values that every accepting path (baked translation, byte-identical
 * content, baked rigid transform) keeps within twice its per-vertex
 * tolerance: the distance of any vertex pair. Two primitives whose sampled
 * distances differ by more than `max(width)` cannot become instances of
 * each other, so they need not be compared.
 */
interface AcceptInvariants {
	/** Distances of `ACCEPT_SAMPLE_PAIRS` consecutive vertex pairs. */
	lengths: number[];
	/** Upper bound of twice the accepting tolerance, with slack. */
	width: number;
}

/**
 * Pending primitives of one cheap fingerprint. Entries with invariants sit
 * in a grid per width level, keyed by the two sampled distances that vary
 * most in the group, so a lookup visits the few cells a copy can be in,
 * not every pending entry.
 */
interface PendingGroup {
	entries: PendingInstancing[];
	/** `entries` before this index are in `wildcards` or `levels`. */
	indexed: number;
	/** Entry count when the grid axes were last chosen. */
	builtAt: number;
	/** Indices into `AcceptInvariants.lengths` used as grid axes. */
	axes: [number, number];
	/** Entries without invariants; compared with every primitive. */
	wildcards: PendingInstancing[];
	levels: Map<number, PendingLevel>;
}

interface PendingLevel {
	/** Cell size, a power of two at least the width of every entry. */
	size: number;
	entries: PendingInstancing[];
	cells: Map<string, PendingInstancing[]>;
}

/** Values of the primitive being loaded, computed at most once. */
interface TargetCache {
	centroid?: [number, number, number];
	bounds?: PositionBounds | null;
}

interface PositionBounds {
	min: [number, number, number];
	max: [number, number, number];
}

/** Relative tolerance of the rigid-copy distance test. */
const RIGID_DISTANCE_TOLERANCE = 5e-4;
/** Above this many cells, a level is scanned instead of looked up. */
const MAX_LOOKUP_CELLS = 64;
/** Pairs of consecutive vertices compared by `canAccept`. */
const ACCEPT_SAMPLE_PAIRS = 8;

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
	// What `canPrimitiveBeInstanced` found for a primitive, by cache key
	// (null: it cannot be instanced). See `getInstancing`.
	private readonly _instancingByPrimitive = new Map<
		string,
		{cheapKey?: string; exactKey?: string} | null
	>();
	// Keyed by the full instance-content description (not its hash), so that
	// adopting a previous primitive as an instance source is an exact match.
	private readonly _loadedByInstanceContent = new Map<string, GeometryData>();
	// Cheap fingerprints (counts/types, no bytes). Collision lists defer the
	// byte-hash / baked-transform walk until a second primitive looks similar.
	private readonly _pendingByCheapKey = new Map<string, PendingGroup>();
	private _pendingSequence = 0;
	private readonly _digitRegex = /\d/;

	private _materialVariantsData = new MaterialVariantsData();
	private _loaded: {
		[key: string]: GeometryData;
	} = {};

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(
		private readonly _content: IGLTF_v2,
		private readonly _accessorLoader: AccessorLoader,
		private readonly _materialLoader: MaterialLoader,
		private readonly _dracoPrimitives: Map<string, IDecodedDracoPrimitive>,
		private readonly _urlHash?: number,
		private readonly _gpuInstancingEnabled: boolean = false,
	) {
		if (!this._gpuInstancingEnabled) return;
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
			array: hashTypedArray(accessor.array),
			byteOffset: accessor.byteOffset,
			byteStride: accessor.byteStride,
			count: accessor.count,
			elementBytes: accessor.elementBytes,
			itemBytes: accessor.itemBytes,
			itemSize: accessor.itemSize,
			normalized: accessor.normalized,
			sparse: accessor.sparse,
			sparseIndices: accessor.sparseIndices
				? hashTypedArray(accessor.sparseIndices)
				: undefined,
			sparseValues: accessor.sparseValues
				? hashTypedArray(accessor.sparseValues)
				: undefined,
		});
	}

	/** FNV-1a over the string, independent of the murmur hash it accompanies. */
	private createStringContentHash(content: string): number {
		let hash = 2166136261;
		for (let i = 0; i < content.length; i++)
			hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
		return hash >>> 0;
	}

	/**
	 * glTF JSON identity of an accessor: same buffer range means the same
	 * bytes without walking them. Undefined for Draco placeholders.
	 */
	private createAccessorIdentity(
		accessorId: number | undefined,
	): string | undefined {
		if (accessorId === undefined) return "";
		const accessor = this._content.accessors?.[accessorId];
		if (!accessor || accessor.bufferView === undefined) return;
		const bufferView = this._content.bufferViews?.[accessor.bufferView];
		return JSON.stringify({
			buffer: bufferView?.buffer,
			bufferView: accessor.bufferView,
			byteOffset: accessor.byteOffset ?? 0,
			byteStride: bufferView?.byteStride,
			componentType: accessor.componentType,
			count: accessor.count,
			normalized: accessor.normalized ?? false,
			sparse: accessor.sparse,
			type: accessor.type,
		});
	}

	/**
	 * Count/type fingerprint that does not read accessor bytes. Two primitives
	 * that could be copies (byte-identical or baked rigid) share this key.
	 */
	private createAccessorFingerprint(
		accessorId: number | undefined,
	): string | undefined {
		if (accessorId === undefined) return "";
		const accessor = this._content.accessors?.[accessorId];
		if (!accessor || accessor.bufferView === undefined) return;
		const itemSize =
			ACCESSORTYPE_V2[<keyof typeof ACCESSORTYPE_V2>accessor.type];
		const elementBytes =
			ACCESSORCOMPONENTSIZE_V2[
				<keyof typeof ACCESSORCOMPONENTSIZE_V2>accessor.componentType
			];
		return JSON.stringify({
			byteLength: accessor.count * itemSize * elementBytes,
			componentType: accessor.componentType,
			count: accessor.count,
			normalized: accessor.normalized ?? false,
			sparse: accessor.sparse
				? {
						count: accessor.sparse.count,
						indexComponentType:
							accessor.sparse.indices.componentType,
					}
				: undefined,
			type: accessor.type,
		});
	}

	private createExactInstanceKey(
		primitive: IGLTF_v2_Primitive,
		materialContent: string,
	): string | undefined {
		const attributes: {[key: string]: string} = {};
		const names = Object.keys(primitive.attributes).sort();
		for (const name of names) {
			const identity = this.createAccessorIdentity(
				primitive.attributes[name],
			);
			if (identity === undefined) return;
			attributes[name] = identity;
		}
		const indices = this.createAccessorIdentity(primitive.indices);
		if (indices === undefined) return;
		return JSON.stringify({
			attributes,
			extensions: primitive.extensions,
			indices,
			material: materialContent,
			mode: primitive.mode,
		});
	}

	private createCheapFingerprint(
		primitive: IGLTF_v2_Primitive,
		materialContent: string,
	): string | undefined {
		const attributes: {[key: string]: string} = {};
		const names = Object.keys(primitive.attributes).sort();
		for (const name of names) {
			const fingerprint = this.createAccessorFingerprint(
				primitive.attributes[name],
			);
			if (fingerprint === undefined) return;
			attributes[name] = fingerprint;
		}
		const indices = this.createAccessorFingerprint(primitive.indices);
		if (indices === undefined) return;
		return JSON.stringify({
			attributes,
			extensions: primitive.extensions,
			indices,
			material: materialContent,
			mode: primitive.mode,
		});
	}

	private getPrimitiveContentHash(
		primitive: IGLTF_v2_Primitive,
	): string | undefined {
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
		return JSON.stringify({
			attributes,
			extensions: primitive.extensions,
			indices: this.createAccessorContentHash(primitive.indices),
			mode: primitive.mode,
		});
	}

	/**
	 * Content that must remain byte-identical when POSITION/NORMAL are related
	 * by a baked rigid transform. Checking it first prevents geometry with
	 * different topology, UVs, colors, or other vertex data from being merged.
	 */
	private getPrimitiveStaticContentHash(
		primitive: IGLTF_v2_Primitive,
	): string | undefined {
		const attributes = Object.fromEntries(
			Object.keys(primitive.attributes)
				.filter((name) => name !== "POSITION" && name !== "NORMAL")
				.sort()
				.map((name) => [
					name,
					this.createAccessorContentHash(primitive.attributes[name]),
				]),
		);
		if (Object.values(attributes).some((hash) => hash === undefined))
			return;
		const indices = this.createAccessorContentHash(primitive.indices);
		if (primitive.indices !== undefined && indices === undefined) return;
		return JSON.stringify({attributes, indices});
	}

	private getPositionBounds(
		primitive: IGLTF_v2_Primitive,
	): PositionBounds | undefined {
		const accessorId = primitive.attributes.POSITION;
		if (accessorId === undefined) return;
		const accessor = this._content.accessors?.[accessorId];
		if (
			!accessor ||
			accessor.min?.length !== 3 ||
			accessor.max?.length !== 3
		)
			return;
		if (
			![...accessor.min, ...accessor.max].every((value) =>
				Number.isFinite(value),
			)
		)
			return;
		return {
			min: [accessor.min[0], accessor.min[1], accessor.min[2]],
			max: [accessor.max[0], accessor.max[1], accessor.max[2]],
		};
	}

	private assignInstanceHash(
		geometryData: GeometryData,
		contentKey: string,
	): void {
		if (geometryData.instanceHash) return;
		const geometryHash =
			this._hashCreator.createMurmurHash(contentKey) +
			"_" +
			this.createStringContentHash(contentKey);
		geometryData.instanceHash =
			this._urlHash !== undefined
				? this._urlHash + "_" + geometryHash
				: geometryHash;
	}

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
	 * Transform-invariant signature for the rigid-copy rejection test. The
	 * rigid extraction path requires corresponding vertex order, so distances
	 * between a few corresponding vertex pairs must agree. Undefined when
	 * POSITION cannot be read; such a primitive keeps the content-hash
	 * fallback and is compared with every pending primitive.
	 */
	private createRigidSignature(
		primitive: IGLTF_v2_Primitive,
	): RigidSignature | undefined {
		const positions = this.getExtractableArray(
			primitive.attributes.POSITION,
			3,
		);
		if (!positions) return;
		const vertexCount = positions.length / 3;
		const distances: number[] = [];
		if (vertexCount >= 2) {
			const pairs = [
				[0, vertexCount - 1],
				[0, Math.floor(vertexCount / 2)],
				[
					Math.floor(vertexCount / 4),
					Math.floor((vertexCount * 3) / 4),
				],
			];
			for (const [a, b] of pairs) {
				if (a === b) continue;
				const ai = a * 3;
				const bi = b * 3;
				const dx = positions[ai] - positions[bi];
				const dy = positions[ai + 1] - positions[bi + 1];
				const dz = positions[ai + 2] - positions[bi + 2];
				distances.push(dx * dx + dy * dy + dz * dz);
			}
		}
		return {positions, distances};
	}

	/**
	 * Constant-size rejection test. A match is only a candidate; all vertices
	 * are still verified before batching.
	 */
	private couldBeRigidCopy(
		target: RigidSignature | undefined,
		source: RigidSignature | undefined,
	): boolean {
		// Preserve the existing content-hash fallback for unsupported layouts.
		if (!source || !target) return true;
		if (source.positions.length !== target.positions.length) return false;
		for (let i = 0; i < source.distances.length; i++) {
			const sourceDistanceSq = source.distances[i];
			const targetDistanceSq = target.distances[i];
			const tolerance =
				Math.max(1, sourceDistanceSq, targetDistanceSq) *
				RIGID_DISTANCE_TOLERANCE;
			if (Math.abs(sourceDistanceSq - targetDistanceSq) > tolerance)
				return false;
		}
		return true;
	}

	/**
	 * Bound the tolerance of every accepting path from above:
	 * - baked translation: `max(1, extents of both bounds) * 1e-5 + 1e-7`,
	 * - baked rigid transform: `source maxDist * 1e-4 + 1e-7`, where
	 *   maxDist is computed here exactly as in `getBakedRepresentative`,
	 * - byte-identical content: 0.
	 * Every vertex then lies within that tolerance of its transformed
	 * source, so every pair distance differs by at most twice it. `width`
	 * adds 1% and a term for coordinate size as slack for rounding.
	 * Null when a value is not finite.
	 */
	private computeAcceptInvariants(
		signature: RigidSignature,
		bounds: PositionBounds | undefined,
		centroid: [number, number, number],
	): AcceptInvariants | null {
		const positions = signature.positions;
		let maxDistSq = 0;
		let maxCoordinate = 0;
		for (let i = 0; i < positions.length; i += 3) {
			const dx = positions[i] - centroid[0];
			const dy = positions[i + 1] - centroid[1];
			const dz = positions[i + 2] - centroid[2];
			const dSq = dx * dx + dy * dy + dz * dz;
			if (dSq > maxDistSq) maxDistSq = dSq;
			maxCoordinate = Math.max(
				maxCoordinate,
				Math.abs(positions[i]),
				Math.abs(positions[i + 1]),
				Math.abs(positions[i + 2]),
			);
		}
		let boundsScale = 1;
		if (bounds)
			for (let i = 0; i < 3; i++)
				boundsScale = Math.max(
					boundsScale,
					bounds.max[i] - bounds.min[i],
				);
		const tolerance =
			Math.max(Math.sqrt(maxDistSq) * 1e-4, boundsScale * 1e-5) + 1e-7;
		const width = 2.02 * tolerance + maxCoordinate * 1e-12 + 1e-9;
		// Neighboring vertices are usually close, so their distance reacts to
		// small shape differences that long diagonals barely register.
		const vertexCount = positions.length / 3;
		const lengths: number[] = [];
		for (let k = 0; k < ACCEPT_SAMPLE_PAIRS && vertexCount >= 2; k++) {
			const ai =
				Math.floor((k * (vertexCount - 1)) / ACCEPT_SAMPLE_PAIRS) * 3;
			const bi = ai + 3;
			const dx = positions[ai] - positions[bi];
			const dy = positions[ai + 1] - positions[bi + 1];
			const dz = positions[ai + 2] - positions[bi + 2];
			lengths.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
		}
		if (!Number.isFinite(width) || !lengths.every(Number.isFinite))
			return null;
		return {lengths, width};
	}

	private getPendingInvariants(
		entry: PendingInstancing,
	): AcceptInvariants | null {
		const signature = entry.signature;
		if (!signature) return null;
		if (signature.invariants === undefined)
			signature.invariants = this.computeAcceptInvariants(
				signature,
				this.getPendingBounds(entry),
				this.computeCentroid(signature.positions),
			);
		return signature.invariants;
	}

	private getTargetInvariants(
		primitive: IGLTF_v2_Primitive,
		signature: RigidSignature,
		targetCache: TargetCache,
	): AcceptInvariants | null {
		if (signature.invariants === undefined) {
			if (targetCache.bounds === undefined)
				targetCache.bounds = this.getPositionBounds(primitive) ?? null;
			if (!targetCache.centroid)
				targetCache.centroid = this.computeCentroid(
					signature.positions,
				);
			signature.invariants = this.computeAcceptInvariants(
				signature,
				targetCache.bounds ?? undefined,
				targetCache.centroid,
			);
		}
		return signature.invariants;
	}

	/** False when no accepting path can map one primitive onto the other. */
	private canAccept(
		target: AcceptInvariants,
		source: AcceptInvariants,
	): boolean {
		const width = Math.max(target.width, source.width);
		for (let i = 0; i < target.lengths.length; i++)
			if (Math.abs(target.lengths[i] - source.lengths[i]) > width)
				return false;
		return true;
	}

	private getCellKey(first: number, second: number): string {
		return first + "," + second;
	}

	/**
	 * Use the two sampled distances with the largest range as grid axes.
	 * Rebuilt each time the group doubles, so indexing stays O(n log n).
	 */
	private chooseGridAxes(group: PendingGroup): void {
		const min: number[] = [];
		const max: number[] = [];
		for (const entry of group.entries) {
			const lengths = this.getPendingInvariants(entry)?.lengths;
			lengths?.forEach((length, k) => {
				if (!(length >= min[k])) min[k] = length;
				if (!(length <= max[k])) max[k] = length;
			});
		}
		const order = max
			.map((value, k) => ({k, range: value - min[k]}))
			.sort((a, b) => b.range - a.range);
		group.axes = [order[0]?.k ?? 0, order[1]?.k ?? 0];
		group.builtAt = group.entries.length;
		group.indexed = 0;
		group.wildcards = [];
		group.levels = new Map();
	}

	/** Put entries added since the last lookup into the grid. */
	private indexPending(group: PendingGroup): void {
		if (group.entries.length >= 2 * group.builtAt)
			this.chooseGridAxes(group);
		for (; group.indexed < group.entries.length; group.indexed++) {
			const entry = group.entries[group.indexed];
			const invariants = this.getPendingInvariants(entry);
			if (!invariants) {
				group.wildcards.push(entry);
				continue;
			}
			const exponent = Math.ceil(Math.log2(invariants.width));
			let level = group.levels.get(exponent);
			if (!level) {
				level = {size: 2 ** exponent, entries: [], cells: new Map()};
				group.levels.set(exponent, level);
			}
			level.entries.push(entry);
			const key = this.getCellKey(
				Math.floor(
					(invariants.lengths[group.axes[0]] ?? 0) / level.size,
				),
				Math.floor(
					(invariants.lengths[group.axes[1]] ?? 0) / level.size,
				),
			);
			const cell = level.cells.get(key);
			if (cell) cell.push(entry);
			else level.cells.set(key, [entry]);
		}
	}

	/**
	 * Pending primitives that pass `couldBeRigidCopy` and can still accept
	 * the target, in insertion order. Entries the grid leaves out cannot
	 * accept it, so the first accepting entry is the same as when every
	 * pending primitive is tried, and the cost does not grow with their
	 * number.
	 */
	private findRigidCopyCandidates(
		primitive: IGLTF_v2_Primitive,
		group: PendingGroup,
		target: RigidSignature | undefined,
		targetCache: TargetCache,
	): PendingInstancing[] {
		const invariants = target
			? this.getTargetInvariants(primitive, target, targetCache)
			: null;
		if (!invariants)
			return group.entries.filter((entry) =>
				this.couldBeRigidCopy(target, entry.signature),
			);

		this.indexPending(group);
		const found = [...group.wildcards];
		const first = invariants.lengths[group.axes[0]] ?? 0;
		const second = invariants.lengths[group.axes[1]] ?? 0;
		for (const level of group.levels.values()) {
			// Every entry of this level has width <= level.size.
			const cellSize = level.size;
			const reach = Math.max(level.size, invariants.width);
			const firstFrom = Math.floor((first - reach) / cellSize);
			const firstTo = Math.floor((first + reach) / cellSize);
			const secondFrom = Math.floor((second - reach) / cellSize);
			const secondTo = Math.floor((second + reach) / cellSize);
			const cells =
				(firstTo - firstFrom + 1) * (secondTo - secondFrom + 1);
			if (!(cells <= MAX_LOOKUP_CELLS)) {
				for (const entry of level.entries) found.push(entry);
				continue;
			}
			for (let a = firstFrom; a <= firstTo; a++)
				for (let b = secondFrom; b <= secondTo; b++) {
					const cell = level.cells.get(this.getCellKey(a, b));
					if (cell) for (const entry of cell) found.push(entry);
				}
		}

		const candidates = found.filter((entry) => {
			if (!this.couldBeRigidCopy(target, entry.signature)) return false;
			const source = entry.signature?.invariants;
			return !source || this.canAccept(invariants, source);
		});
		candidates.sort((a, b) => a.sequence - b.sequence);
		return candidates;
	}

	private addPending(cheapKey: string, entry: PendingInstancing): void {
		let group = this._pendingByCheapKey.get(cheapKey);
		if (!group) {
			group = {
				entries: [],
				indexed: 0,
				builtAt: 0,
				axes: [0, 0],
				wildcards: [],
				levels: new Map(),
			};
			this._pendingByCheapKey.set(cheapKey, group);
		}
		group.entries.push(entry);
	}

	private getPendingBounds(
		entry: PendingInstancing,
	): PositionBounds | undefined {
		if (entry.bounds === undefined)
			entry.bounds = this.getPositionBounds(entry.primitive) ?? null;
		return entry.bounds ?? undefined;
	}

	/**
	 * Fast path for the common case where otherwise identical geometry has only
	 * a translation baked into POSITION. Accessor bounds select the candidate;
	 * every position and normal is still verified before it is accepted.
	 */
	private tryExtractBakedTranslation(
		primitive: IGLTF_v2_Primitive,
		pending: PendingInstancing,
		targetCache: TargetCache,
	): number[] | undefined {
		const sourceBounds = this.getPendingBounds(pending);
		if (targetCache.bounds === undefined)
			targetCache.bounds = this.getPositionBounds(primitive) ?? null;
		const targetBounds = targetCache.bounds;
		if (!sourceBounds || !targetBounds) return;

		const sourceExtent = sourceBounds.max.map(
			(value, index) => value - sourceBounds.min[index],
		);
		const targetExtent = targetBounds.max.map(
			(value, index) => value - targetBounds.min[index],
		);
		const scale = Math.max(1, ...sourceExtent, ...targetExtent);
		const tolerance = scale * 1e-5 + 1e-7;
		for (let i = 0; i < 3; i++)
			if (Math.abs(sourceExtent[i] - targetExtent[i]) > tolerance) return;

		const translation: [number, number, number] = [
			targetBounds.min[0] - sourceBounds.min[0],
			targetBounds.min[1] - sourceBounds.min[1],
			targetBounds.min[2] - sourceBounds.min[2],
		];
		// Prefer the byte-identical path for zero-translation candidates.
		if (
			Math.abs(translation[0]) <= tolerance &&
			Math.abs(translation[1]) <= tolerance &&
			Math.abs(translation[2]) <= tolerance
		)
			return;

		const sourcePositions = this.getExtractableArray(
			pending.primitive.attributes.POSITION,
			3,
		);
		const targetPositions = this.getExtractableArray(
			primitive.attributes.POSITION,
			3,
		);
		if (
			!sourcePositions ||
			!targetPositions ||
			sourcePositions.length !== targetPositions.length
		)
			return;

		const toleranceSq = tolerance * tolerance;
		for (let i = 0; i < targetPositions.length; i += 3) {
			const dx = sourcePositions[i] + translation[0] - targetPositions[i];
			const dy =
				sourcePositions[i + 1] +
				translation[1] -
				targetPositions[i + 1];
			const dz =
				sourcePositions[i + 2] +
				translation[2] -
				targetPositions[i + 2];
			if (dx * dx + dy * dy + dz * dz > toleranceSq) return;
		}

		const sourceNormals = this.getExtractableArray(
			pending.primitive.attributes.NORMAL,
			3,
		);
		const targetNormals = this.getExtractableArray(
			primitive.attributes.NORMAL,
			3,
		);
		if (pending.primitive.attributes.NORMAL !== undefined && !sourceNormals)
			return;
		if (primitive.attributes.NORMAL !== undefined && !targetNormals) return;
		if ((sourceNormals === undefined) !== (targetNormals === undefined))
			return;
		if (sourceNormals && targetNormals) {
			if (sourceNormals.length !== targetNormals.length) return;
			const normalToleranceSq = 25e-6;
			for (let i = 0; i < targetNormals.length; i += 3) {
				const dx = sourceNormals[i] - targetNormals[i];
				const dy = sourceNormals[i + 1] - targetNormals[i + 1];
				const dz = sourceNormals[i + 2] - targetNormals[i + 2];
				if (dx * dx + dy * dy + dz * dz > normalToleranceSq) return;
			}
		}

		return [
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			translation[0],
			translation[1],
			translation[2],
			1,
		];
	}

	/**
	 * Build a baked-transform frame for a pending primitive. Cached on the
	 * pending entry so a cheap-key collision pays this walk at most once.
	 */
	private getBakedRepresentative(
		pending: PendingInstancing,
	): BakedRepresentative | undefined {
		if (pending.bakedRep) return pending.bakedRep;
		if (pending.primitive.attributes.TANGENT !== undefined) return;

		const positions = this.getExtractableArray(
			pending.primitive.attributes.POSITION,
			3,
		);
		if (!positions) return;
		const normals = this.getExtractableArray(
			pending.primitive.attributes.NORMAL,
			3,
		);
		if (pending.primitive.attributes.NORMAL !== undefined && !normals)
			return;

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
		if (frameIndexB < 0 || Math.sqrt(maxRejectionSq) < maxDist * 1e-5)
			return;

		pending.bakedRep = {
			positions,
			normals,
			centroid,
			frameIndexA,
			frameIndexB,
			maxDist,
		};
		return pending.bakedRep;
	}

	/**
	 * Try to explain this primitive as a rigid transform of a pending one.
	 */
	private tryExtractBakedInstance(
		primitive: IGLTF_v2_Primitive,
		pending: PendingInstancing,
		targetCache: TargetCache,
	): number[] | undefined {
		if (primitive.attributes.TANGENT !== undefined) return;
		const representative = this.getBakedRepresentative(pending);
		if (!representative) return;

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
		if (representative.positions.length !== positions.length) return;
		if ((representative.normals === undefined) !== (normals === undefined))
			return;

		if (!targetCache.centroid)
			targetCache.centroid = this.computeCentroid(positions);
		return this.deriveRigidTransform(
			representative,
			positions,
			normals,
			targetCache.centroid,
		);
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
				cheapKey?: string;
				exactKey?: string;
				instance?: GeometryData;
		  }
		| undefined {
		if (!this._gpuInstancingEnabled) return;
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

		const exactKey = this.createExactInstanceKey(
			primitive,
			materialContent,
		);
		const cheapKey = this.createCheapFingerprint(
			primitive,
			materialContent,
		);
		const instance = exactKey
			? this._loadedByInstanceContent.get(exactKey)
			: undefined;

		return {cheapKey, exactKey, instance};
	}

	/**
	 * `canPrimitiveBeInstanced` for the primitive `cacheKey` names. Nodes that
	 * share a glTF mesh come here once per node with the same primitive, and
	 * the answer and the keys depend only on the mesh and the primitive, so
	 * they are worked out the first time (the other nodes walked the
	 * references of the mesh and built both keys again each time). The
	 * instance source is looked up again: it can have been added since.
	 */
	private getInstancing(
		meshId: number,
		primitive: IGLTF_v2_Primitive,
		cacheKey: string,
	):
		| {
				cheapKey?: string;
				exactKey?: string;
				instance?: GeometryData;
		  }
		| undefined {
		if (!this._gpuInstancingEnabled) return;
		const known = this._instancingByPrimitive.get(cacheKey);
		if (known === undefined) {
			const result = this.canPrimitiveBeInstanced(meshId, primitive);
			this._instancingByPrimitive.set(
				cacheKey,
				result
					? {cheapKey: result.cheapKey, exactKey: result.exactKey}
					: null,
			);
			return result;
		}
		if (known === null) return;
		return {
			cheapKey: known.cheapKey,
			exactKey: known.exactKey,
			instance: known.exactKey
				? this._loadedByInstanceContent.get(known.exactKey)
				: undefined,
		};
	}

	private addInstance(
		geometryData: GeometryData,
		cacheKey: string,
		material: IMaterialAbstractData | null,
		offsetMatrix?: number[],
		contentKey?: string,
	): GeometryData {
		if (contentKey) this.assignInstanceHash(geometryData, contentKey);
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
		const cacheKey = "mesh_" + meshId + "_primitive_" + index;
		const instancing = this.getInstancing(meshId, primitive, cacheKey);

		let material = null;
		if (primitive.material || primitive.material === 0)
			material = this._materialLoader.getMaterial(primitive.material);

		// Check cache first - important for scenes with many instances of same mesh
		if (this._loaded[cacheKey]) {
			if (instancing)
				return this.addInstance(
					this._loaded[cacheKey],
					cacheKey,
					material,
					undefined,
					instancing.exactKey ?? cacheKey,
				);
			return this._loaded[cacheKey];
		}

		if (instancing?.instance)
			return this.addInstance(
				instancing.instance,
				cacheKey,
				material,
				undefined,
				instancing.exactKey,
			);

		// Needed for the lookup, and again if this primitive becomes pending.
		const rigidSignature = instancing?.cheapKey
			? this.createRigidSignature(primitive)
			: undefined;
		if (instancing?.cheapKey) {
			const pending = this._pendingByCheapKey.get(instancing.cheapKey);
			if (pending && pending.entries.length > 0) {
				const targetCache: TargetCache = {};
				const plausible = this.findRigidCopyCandidates(
					primitive,
					pending,
					rigidSignature,
					targetCache,
				);
				const staticContentHash =
					plausible.length > 0
						? this.getPrimitiveStaticContentHash(primitive)
						: undefined;
				const compatible = plausible.filter((entry) => {
					if (staticContentHash === undefined) return true;
					if (entry.staticContentHash === undefined)
						entry.staticContentHash =
							this.getPrimitiveStaticContentHash(entry.primitive);
					return entry.staticContentHash === staticContentHash;
				});

				if (staticContentHash !== undefined) {
					for (const entry of compatible) {
						const offsetMatrix = this.tryExtractBakedTranslation(
							primitive,
							entry,
							targetCache,
						);
						if (!offsetMatrix) continue;
						const instance = this.addInstance(
							entry.geometryData,
							cacheKey,
							material,
							offsetMatrix,
							instancing.exactKey ?? instancing.cheapKey,
						);
						if (
							instancing.exactKey &&
							!this._loadedByInstanceContent.has(
								instancing.exactKey,
							)
						)
							this._loadedByInstanceContent.set(
								instancing.exactKey,
								instance,
							);
						return instance;
					}
				}

				const contentHash =
					compatible.length > 0
						? this.getPrimitiveContentHash(primitive)
						: undefined;
				if (contentHash) {
					for (const entry of compatible) {
						if (entry.contentHash === undefined)
							entry.contentHash = this.getPrimitiveContentHash(
								entry.primitive,
							);
						if (entry.contentHash === contentHash)
							return this.addInstance(
								entry.geometryData,
								cacheKey,
								material,
								undefined,
								contentHash,
							);
					}
				}
				for (const entry of compatible) {
					const offsetMatrix = this.tryExtractBakedInstance(
						primitive,
						entry,
						targetCache,
					);
					if (!offsetMatrix) continue;
					const instance = this.addInstance(
						entry.geometryData,
						cacheKey,
						material,
						offsetMatrix,
						instancing.exactKey ?? instancing.cheapKey,
					);
					if (
						instancing.exactKey &&
						!this._loadedByInstanceContent.has(instancing.exactKey)
					)
						this._loadedByInstanceContent.set(
							instancing.exactKey,
							instance,
						);
					return instance;
				}
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
			// Decoded before the scene conversion, see GLTFLoader.decodeDraco.
			const decoded = this._dracoPrimitives.get(meshId + "_" + index);
			if (!decoded)
				throw new Error(
					"GeometryLoader.loadPrimitive: Draco primitive was not decoded.",
				);
			for (const attribute of decoded.attributes) {
				const array = attribute.array;
				attributes[attribute.name] = new AttributeData(
					array,
					attribute.numComponents, // itemSize
					array.BYTES_PER_ELEMENT * attribute.numComponents, // itemBytes
					attribute.byteOffset, // byteOffset
					array.BYTES_PER_ELEMENT, // elementBytes
					attribute.normalized, // normalized
					array.length / attribute.numComponents, // count
				);
			}
			if (decoded.indices)
				indices = new AttributeData(
					decoded.indices,
					1, // itemSize
					decoded.indices.BYTES_PER_ELEMENT, // itemBytes
					0, // byteOffset
					decoded.indices.BYTES_PER_ELEMENT, // elementBytes
					false, // normalized
					decoded.indices.length, // count
				);
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
		this._loaded["mesh_" + meshId + "_primitive_" + index] = geometryData;
		if (instancing?.exactKey)
			this._loadedByInstanceContent.set(
				instancing.exactKey,
				geometryData,
			);
		if (instancing?.cheapKey)
			this.addPending(instancing.cheapKey, {
				primitive,
				geometryData,
				sequence: this._pendingSequence++,
				signature: rigidSignature,
			});

		return geometryData;
	}

	// #endregion Private Methods (1)
}
