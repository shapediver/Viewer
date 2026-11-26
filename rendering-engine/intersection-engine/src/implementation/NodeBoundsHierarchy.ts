import {
	type GeometryData,
	type ITreeNode,
} from "@shapediver/viewer.shared.node-tree";
import * as THREE from "three";

/**
 * A node that is tested by a pick, as the intersection engine and the
 * interaction feature keep them.
 */
export interface INodeBoundsEntry {
	node: ITreeNode;
	geometryData: {[key: string]: GeometryData};
}

/** Where one instance occurrence is drawn: a slot of an instanced mesh. */
export interface IInstanceSlot {
	mesh: THREE.InstancedMesh;
	slot: number;
}

/**
 * The thresholds of the raycaster a query runs with
 * (`params.Line.threshold` and `params.Points.threshold`).
 */
export interface IRayThresholds {
	line: number;
	points: number;
}

type PositionAttribute =
	| THREE.BufferAttribute
	| THREE.InterleavedBufferAttribute;

/** What the hierarchy knew about one object when it recorded a node. */
interface IRecordedObject {
	object: THREE.Object3D;
	parent: THREE.Object3D | null;
	childCount: number;
	/** The raycast function, which the interaction feature swaps while it picks. */
	raycast: THREE.Object3D["raycast"];
	/** Set for a mesh, line or points object that a box stands in for. */
	geometry: THREE.BufferGeometry | null;
	position: PositionAttribute | null;
	positionVersion: number;
	/** The box of the geometry when it was recorded (null: none). */
	boundingBox: THREE.Box3 | null;
	/** Min and max of `boundingBox` when it was recorded. */
	boundsKey: Float64Array;
	matrix: Float64Array;
	/**
	 * The sum of the local scale of a line or points object, which their
	 * raycast divides the threshold by. NaN for any other object.
	 */
	scale: number;
}

/**
 * What a node has below its converted object. Entries of the same node
 * (the engine has one per geometry data) share it.
 */
interface IRecording {
	node: ITreeNode;
	root: THREE.Object3D | undefined;
	objects: IRecordedObject[];
	/** Something below the root is hit through its raycast, not a box. */
	always: boolean;
	/** Something below the root has a raycast other than `Object3D`'s. */
	pickable: boolean;
	/** The children of the root when it was recorded. */
	rootChildren: THREE.Object3D[];
	/** The union of the world boxes of the meshes, lines and points. */
	box: THREE.Box3;
	/**
	 * How much the box grows per unit of the line and the points threshold
	 * of a query, per axis. Zero without lines or points.
	 */
	lineWiden: THREE.Vector3;
	pointsWiden: THREE.Vector3;
	/** The entries that share this recording. */
	entries: number[];
}

/** One instance occurrence (a node and one of its geometry data). */
interface IOccurrence extends IInstanceSlot {
	/** `${node.id}:${geometry.id}`, as the instanced mesh stores it. */
	key: string;
	/** The 16 floats of the slot the box was made for. */
	matrix: Float32Array;
	/** The world box of the geometry under the matrix of the slot. */
	box: THREE.Box3;
	/** The entries whose test can return a hit of this occurrence. */
	entries: number[];
	/** The scan that saw it last. */
	seen: number;
}

/** What the hierarchy knew about one instanced mesh at its last scan. */
interface IMeshState {
	mesh: THREE.InstancedMesh;
	attribute: THREE.InstancedBufferAttribute;
	version: number;
	count: number;
	keys: unknown;
	nodes: unknown;
	raycast: THREE.Object3D["raycast"];
	geometry: THREE.BufferGeometry;
	position: PositionAttribute | undefined;
	positionVersion: number;
	boundingBox: THREE.Box3 | null;
	boundsKey: Float64Array;
	matrix: Float64Array;
	/** The box of the geometry, as `Mesh.raycast` tests it. */
	local: THREE.Box3;
	/** Its slots are bounded: see `boundable`. */
	boundable: boolean;
	/** The occurrences of its active slots, in slot order. */
	occurrences: IOccurrence[];
}

/**
 * The instanced meshes below one parent (the instanced root of a
 * viewport), or one instanced mesh without a parent.
 */
interface IContainer {
	owner: THREE.Object3D;
	/** The children of the owner at the last scan. */
	children: THREE.Object3D[];
	meshes: IMeshState[];
	/**
	 * The instance hashes with a mesh whose slots are not bounded. The
	 * engine tests the meshes of one hash together, so one such mesh makes
	 * the entries of that hash candidates for every ray, and no other.
	 */
	unbounded: Set<unknown>;
}

interface ILeaf {
	entry: INodeBoundsEntry;
	geometryData: {[key: string]: GeometryData};
	/** One of the geometry data of the entry converts to an instanced mesh. */
	instanced: boolean;
	/** The container and hash of each instanced mesh of the entry. */
	groups: {container: IContainer; hash: unknown}[];
	recording: IRecording;
	always: boolean;
}

/** A leaf of the tree: the recording of an entry, or one occurrence. */
interface IItem {
	entry: number;
	occurrence?: IOccurrence;
}

interface IHierarchyNode {
	box: THREE.Box3;
	lineWiden: THREE.Vector3;
	pointsWiden: THREE.Vector3;
	left?: IHierarchyNode;
	right?: IHierarchyNode;
	/** Item indices, for a node without children. */
	items?: number[];
}

/**
 * Work counts. They are written only if a test put the object there first
 * (`globalThis.__nodeBoundsStats`, see the `picking` counter of the
 * performance tests): the module publishes nothing itself.
 */
interface IStats {
	queries: number;
	/** Objects compared with the scene. */
	objectsChecked: number;
	rebuilds: number;
	/** Entries returned as candidates: the nodes a query tests. */
	nodesTested?: number;
	/** Instance slots compared with what was recorded for them. */
	instancesChecked?: number;
}

function testStats(): IStats | undefined {
	return (globalThis as {__nodeBoundsStats?: IStats}).__nodeBoundsStats;
}

const LEAVES_PER_NODE = 4;
const BOX_EXPANSION = 1e-6;
const NO_SLOTS: readonly IInstanceSlot[] = [];

function positionVersion(position: PositionAttribute | undefined): number {
	if (!position) return 0;
	return (position as THREE.InterleavedBufferAttribute)
		.isInterleavedBufferAttribute
		? (position as THREE.InterleavedBufferAttribute).data.version
		: (position as THREE.BufferAttribute).version;
}

/** The box the hierarchy uses for a geometry, in its own space. */
function localBox(
	geometry: THREE.BufferGeometry,
	position: PositionAttribute,
): THREE.Box3 {
	// The box of the geometry, as `Mesh.raycast` reads it. If there is
	// none, three.js skips its box test, so the box of the vertices is
	// computed into a box of our own. The geometry is not written to: that
	// would make three.js reject rays against a box that goes stale.
	return (
		geometry.boundingBox ??
		new THREE.Box3().setFromBufferAttribute(
			// It only calls getX, getY and getZ, which both kinds have.
			position as THREE.BufferAttribute,
		)
	);
}

function expandSlightly(box: THREE.Box3, size: THREE.Vector3): void {
	if (box.isEmpty()) return;
	box.getSize(size);
	box.expandByScalar(BOX_EXPANSION * size.length() + 1e-9);
}

function sameSet(a: Set<unknown>, b: Set<unknown>): boolean {
	if (a.size !== b.size) return false;
	for (const value of a) if (!b.has(value)) return false;
	return true;
}

/** The container of an instanced mesh. */
function ownerOf(mesh: THREE.Object3D): THREE.Object3D {
	return mesh.parent ?? mesh;
}

/**
 * A bounds hierarchy over the nodes a pick tests, so a ray only visits the
 * nodes whose bounds it can hit instead of every node.
 *
 * The tree has two kinds of leaves:
 * - The recording of an entry: every object below the converted object of
 *   its node, hidden source meshes of batched members included (their
 *   boxes stand in for the members of the batch). A mesh is bounded if its
 *   raycast is exactly the one of `Mesh`, a line (`Line`, `LineSegments`,
 *   `LineLoop`) or a points object if it is exactly the one of `Line` or
 *   `Points`. The box of a line or points object grows with the threshold
 *   of the query, as their raycast finds what is that close to the ray.
 *   An object with any other raycast (a sprite, a `Line2`, a subclass, a
 *   wrapped function), a skinned or a morphed mesh makes the entry a
 *   candidate for every ray. An object with the raycast of `Object3D`
 *   finds nothing and is not looked at.
 * - One instance occurrence of a GPU instanced mesh: the box of the
 *   geometry under the matrix of its slot. An occurrence belongs to the
 *   entries whose test can return a hit of it (the entry of its node and
 *   geometry, and of an ancestor that holds the same geometry data). A
 *   query hands the engine the occurrences it hit for an entry
 *   (`instanceSlots`), so only those instances are tested.
 *
 * Nothing tells the hierarchy that a node moved or that its geometry was
 * replaced: `updateNode`, `updateNodeTransformation`, dragging and
 * animations do not emit `VIEWPORT_UPDATED`. So every query first compares
 * what it recorded (parent, child count, raycast function, geometry,
 * position attribute version, bounding box, world matrix) with the scene,
 * once per node, and records the nodes that differ again. A node whose
 * entries all convert to instanced meshes has nothing of its own to
 * compare (see `validate`). The instanced meshes are compared as a whole
 * (their matrix attribute is written with a new version on every change):
 * only the slots of a mesh that changed are compared with what was
 * recorded for them. The boxes of the tree are then fitted to the new
 * boxes, or the tree is built again if a leaf appeared or disappeared. The
 * answer is exactly the nodes the plain loop would have given results for,
 * in the same order.
 *
 * The hierarchy never writes into three.js objects: the box of a geometry
 * that has none is computed into a box of its own.
 */
export class NodeBoundsHierarchy {
	/** Objects compared with the scene since the last query was counted. */
	private _checked = 0;
	/** Instance slots compared since the last query was counted. */
	private _instancesChecked = 0;
	private _entries: INodeBoundsEntry[] = [];
	private _leaves: ILeaf[] = [];
	private _recordings: IRecording[] = [];
	private _always: number[] = [];
	private _alwaysKey = "";
	private _items: IItem[] = [];
	private _root: IHierarchyNode | undefined;
	private _dirty = true;

	/** The instanced meshes are scanned again from the leaves. */
	private _instancesStale = true;
	private readonly _containers = new Map<THREE.Object3D, IContainer>();
	private readonly _occurrences = new Map<string, IOccurrence>();
	/**
	 * `${node.id}:${geometry.id}` of each instanced geometry data of an
	 * entry, with what a slot must match to be tested for that entry.
	 */
	private readonly _instancedEntryKeys = new Map<
		string,
		{entry: number; hash: unknown; owner: THREE.Object3D}[]
	>();
	private _scan = 0;

	/** The occurrences a query hit, per entry, until the next query. */
	private readonly _slots = new Map<number, IInstanceSlot[]>();
	private _stamps: number[] = [];
	private _query = 0;

	private readonly _size = new THREE.Vector3();
	private readonly _center = new THREE.Vector3();
	private readonly _widened = new THREE.Box3();
	private readonly _slotMatrix = new THREE.Matrix4();

	constructor(private readonly _viewportId: string) {}

	/**
	 * Replace the nodes. The list is kept, not copied: it must not change
	 * without another call of this method.
	 */
	public setNodes(entries: INodeBoundsEntry[]): void {
		this._entries = entries;
		this._dirty = true;
	}

	/**
	 * The indices of the entries that can have a hit with the ray, ascending.
	 *
	 * @param thresholds the line and points thresholds of the raycaster the
	 * entries are tested with. Without them, an entry with a line or points
	 * object is a candidate for every ray.
	 */
	public candidates(ray: THREE.Ray, thresholds?: IRayThresholds): number[] {
		this.validate();
		const stats = testStats();
		if (stats) {
			stats.queries++;
			stats.objectsChecked += this._checked;
			stats.instancesChecked =
				(stats.instancesChecked ?? 0) + this._instancesChecked;
		}
		this._checked = 0;
		this._instancesChecked = 0;

		const lineThreshold = thresholds ? Math.abs(thresholds.line) : Infinity;
		const pointsThreshold = thresholds
			? Math.abs(thresholds.points)
			: Infinity;
		const stamp = ++this._query;
		const stamps = this._stamps;
		this._slots.clear();

		// The leaves of the tree that are only hit through their box, if the
		// ray hits that box. Each item is in one node of the tree. The
		// entries that are candidates for every ray are merged in below;
		// they are already in ascending order, so they are not sorted again
		// on every query.
		const hit: number[] = [];
		const stack: IHierarchyNode[] = this._root ? [this._root] : [];
		while (stack.length > 0) {
			const current = stack.pop()!;
			if (
				!this.hitsWidened(
					ray,
					current.box,
					current.lineWiden,
					current.pointsWiden,
					lineThreshold,
					pointsThreshold,
				)
			)
				continue;
			if (current.items) {
				for (const index of current.items) {
					const item = this._items[index];
					const occurrence = item.occurrence;
					if (occurrence) {
						if (!ray.intersectsBox(occurrence.box)) continue;
						for (const entry of occurrence.entries) {
							if (this._leaves[entry].always) continue;
							let slots = this._slots.get(entry);
							if (!slots) this._slots.set(entry, (slots = []));
							slots.push(occurrence);
							if (stamps[entry] !== stamp) {
								stamps[entry] = stamp;
								hit.push(entry);
							}
						}
						continue;
					}
					const leaf = this._leaves[item.entry];
					if (leaf.always || stamps[item.entry] === stamp) continue;
					const recording = leaf.recording;
					if (
						this.hitsWidened(
							ray,
							recording.box,
							recording.lineWiden,
							recording.pointsWiden,
							lineThreshold,
							pointsThreshold,
						)
					) {
						stamps[item.entry] = stamp;
						hit.push(item.entry);
					}
				}
			} else {
				if (current.left) stack.push(current.left);
				if (current.right) stack.push(current.right);
			}
		}
		const result = this.mergeAlways(hit);
		if (stats) stats.nodesTested = (stats.nodesTested ?? 0) + result.length;
		return result;
	}

	/**
	 * The instance occurrences of the last query to test for an entry,
	 * in no particular order: the only instances of its instanced meshes
	 * that can give it a hit. Undefined if the instances of the entry are
	 * not bounded (test every instance, as without the hierarchy).
	 */
	public instanceSlots(index: number): readonly IInstanceSlot[] | undefined {
		const leaf = this._leaves[index];
		if (!leaf || !leaf.instanced || leaf.always) return undefined;
		return this._slots.get(index) ?? NO_SLOTS;
	}

	private mergeAlways(hit: number[]): number[] {
		const always = this._always;
		if (hit.length === 0) return always.slice();
		hit.sort((a, b) => a - b);
		if (always.length === 0) return hit;
		const result = new Array<number>(always.length + hit.length);
		let a = 0;
		let h = 0;
		let r = 0;
		while (a < always.length && h < hit.length)
			result[r++] = always[a] < hit[h] ? always[a++] : hit[h++];
		while (a < always.length) result[r++] = always[a++];
		while (h < hit.length) result[r++] = hit[h++];
		return result;
	}

	/**
	 * Whether the ray hits the box grown by the widening of its lines and
	 * points for the thresholds of the query.
	 */
	private hitsWidened(
		ray: THREE.Ray,
		box: THREE.Box3,
		lineWiden: THREE.Vector3,
		pointsWiden: THREE.Vector3,
		lineThreshold: number,
		pointsThreshold: number,
	): boolean {
		const grow = (axis: "x" | "y" | "z") =>
			(lineWiden[axis] > 0 ? lineWiden[axis] * lineThreshold : 0) +
			(pointsWiden[axis] > 0 ? pointsWiden[axis] * pointsThreshold : 0);
		const x = grow("x");
		const y = grow("y");
		const z = grow("z");
		if (x === 0 && y === 0 && z === 0) return ray.intersectsBox(box);
		if (!Number.isFinite(x + y + z)) return true;
		const widened = this._widened;
		widened.min.set(box.min.x - x, box.min.y - y, box.min.z - z);
		widened.max.set(box.max.x + x, box.max.y + y, box.max.z + z);
		return ray.intersectsBox(widened);
	}

	private validate(): void {
		if (this._dirty || this._leaves.length !== this._entries.length) {
			this.buildAll();
			return;
		}
		let stale = false;
		let structural = false;
		const viewportId = this._viewportId;
		// The geometry data of an entry can be replaced (the interaction
		// feature does so on an update of a node), and an entry can start or
		// stop converting to an instanced mesh.
		let switched: Set<IRecording> | undefined;
		for (let i = 0; i < this._leaves.length; i++) {
			const leaf = this._leaves[i];
			const geometryData = leaf.entry.geometryData;
			let instanced = false;
			for (const key in geometryData) {
				const converted = geometryData[key].convertedObject[viewportId];
				if (!(converted instanceof THREE.InstancedMesh)) continue;
				instanced = true;
				// A mesh in a container that was not scanned.
				if (!this._containers.has(ownerOf(converted)))
					this._instancesStale = true;
			}
			if (
				geometryData === leaf.geometryData &&
				instanced === leaf.instanced
			)
				continue;
			if (instanced !== leaf.instanced)
				(switched ??= new Set()).add(leaf.recording);
			leaf.geometryData = geometryData;
			leaf.instanced = instanced;
			this._instancesStale = true;
			stale = true;
		}
		for (let r = 0; r < this._recordings.length; r++) {
			const recording = this._recordings[r];
			const switchedHere = switched?.has(recording) === true;
			// A node whose entries all convert to instanced meshes, and that
			// had nothing a ray can hit below it (only the groups and
			// placeholders of its instances), is not compared: on a scene of
			// instances that would be every node on every query. Only its
			// converted object and that object's children are compared (a
			// data added to the node is a new child), not counted as objects.
			// It is recorded again when they differ, or when one of its
			// entries starts or stops converting to an instanced mesh.
			// SS-10642 replaces this with the change clock. A node with
			// anything a ray can hit below it (an entry of
			// the interaction feature also holds the geometry data of the
			// nodes below it) is compared like any other.
			if (
				!switchedHere &&
				!recording.pickable &&
				this.allInstanced(recording) &&
				this.sameRoot(recording)
			)
				continue;
			if (!switchedHere && this.isCurrent(recording)) continue;
			const fresh = this.record(recording.node, recording.entries);
			this._recordings[r] = fresh;
			stale = true;
			if (fresh.box.isEmpty() !== recording.box.isEmpty())
				structural = true;
			for (const index of recording.entries)
				this._leaves[index].recording = fresh;
		}
		const instances = this.validateInstances();
		if (!stale && !instances.changed) return;
		const stats = testStats();
		if (stats) stats.rebuilds++;
		this.setAlways();
		const alwaysChanged = this.alwaysKey() !== this._alwaysKey;
		if (structural || instances.structural || alwaysChanged || !this._root)
			this.buildTree();
		else this.refit(this._root);
	}

	/**
	 * Whether the node has the same converted object with the same children
	 * as when it was recorded. A data added to a node (a `ThreejsData`, say)
	 * is a new child of its converted object, which is kept.
	 */
	private sameRoot(recording: IRecording): boolean {
		const root = recording.node.convertedObject[this._viewportId] as
			| THREE.Object3D
			| undefined;
		if (root !== recording.root) return false;
		if (!root) return true;
		const children = recording.rootChildren;
		if (root.children.length !== children.length) return false;
		for (let i = 0; i < children.length; i++)
			if (root.children[i] !== children[i]) return false;
		return true;
	}

	/** Whether every entry of the node converts to an instanced mesh. */
	private allInstanced(recording: IRecording): boolean {
		for (const index of recording.entries)
			if (!this._leaves[index].instanced) return false;
		return true;
	}

	/** Whether a node still looks as it did when it was recorded. */
	private isCurrent(recording: IRecording): boolean {
		const root = recording.node.convertedObject[this._viewportId] as
			| THREE.Object3D
			| undefined;
		if (root !== recording.root) return false;
		const objects = recording.objects;
		this._checked += objects.length;
		for (let i = 0; i < objects.length; i++) {
			const recorded = objects[i];
			const object = recorded.object;
			if (
				object.parent !== recorded.parent ||
				object.children.length !== recorded.childCount ||
				object.raycast !== recorded.raycast
			)
				return false;
			const geometry = recorded.geometry;
			if (geometry === null) continue;
			const mesh = object as THREE.Mesh;
			if (mesh.geometry !== geometry) return false;
			const position = geometry.attributes.position as
				| PositionAttribute
				| undefined;
			if (position !== recorded.position) return false;
			if (
				position &&
				positionVersion(position) !== recorded.positionVersion
			)
				return false;
			const bounds = geometry.boundingBox;
			if (bounds !== recorded.boundingBox) return false;
			if (
				bounds &&
				(bounds.min.x !== recorded.boundsKey[0] ||
					bounds.min.y !== recorded.boundsKey[1] ||
					bounds.min.z !== recorded.boundsKey[2] ||
					bounds.max.x !== recorded.boundsKey[3] ||
					bounds.max.y !== recorded.boundsKey[4] ||
					bounds.max.z !== recorded.boundsKey[5])
			)
				return false;
			const elements = object.matrixWorld.elements;
			const matrix = recorded.matrix;
			for (let k = 0; k < 16; k++)
				if (elements[k] !== matrix[k]) return false;
			if (
				!Number.isNaN(recorded.scale) &&
				object.scale.x + object.scale.y + object.scale.z !==
					recorded.scale
			)
				return false;
		}
		return true;
	}

	private buildAll(): void {
		const byNode = new Map<ITreeNode, number[]>();
		this._entries.forEach((entry, index) => {
			const indices = byNode.get(entry.node);
			if (indices) indices.push(index);
			else byNode.set(entry.node, [index]);
		});
		this._recordings = [];
		this._leaves = new Array<ILeaf>(this._entries.length);
		this._stamps = new Array<number>(this._entries.length).fill(0);
		for (const [node, indices] of byNode) {
			const recording = this.record(node, indices);
			this._recordings.push(recording);
			for (const index of indices) {
				const entry = this._entries[index];
				let instanced = false;
				for (const key in entry.geometryData)
					if (
						entry.geometryData[key].convertedObject[
							this._viewportId
						] instanceof THREE.InstancedMesh
					) {
						instanced = true;
						break;
					}
				this._leaves[index] = {
					entry,
					geometryData: entry.geometryData,
					instanced,
					groups: [],
					recording,
					always: false,
				};
			}
		}
		this.scanInstances();
		this.setAlways();
		this.buildTree();
	}

	private setAlways(): void {
		const always: number[] = [];
		this._leaves.forEach((leaf, index) => {
			// An entry with instances is bounded by its occurrences if every
			// instanced mesh it can be hit through is. Without a converted
			// object and without instances there is nothing to bound, and
			// the engine may still find a batched hit for it.
			leaf.always =
				leaf.recording.always ||
				(leaf.instanced
					? leaf.groups.some((group) =>
							group.container.unbounded.has(group.hash),
						)
					: !leaf.recording.root);
			if (leaf.always) always.push(index);
		});
		this._always = always;
	}

	private alwaysKey(): string {
		return this._always.join(",");
	}

	private record(node: ITreeNode, entries: number[]): IRecording {
		const root = node.convertedObject[this._viewportId] as
			| THREE.Object3D
			| undefined;
		const recording: IRecording = {
			node,
			root,
			objects: [],
			always: false,
			pickable: false,
			rootChildren: root ? root.children.slice() : [],
			box: new THREE.Box3(),
			lineWiden: new THREE.Vector3(),
			pointsWiden: new THREE.Vector3(),
			entries,
		};
		if (!root) return recording;

		root.traverse((object) => {
			const recorded: IRecordedObject = {
				object,
				parent: object.parent,
				childCount: object.children.length,
				raycast: object.raycast,
				geometry: null,
				position: null,
				positionVersion: 0,
				boundingBox: null,
				boundsKey: new Float64Array(6),
				matrix: new Float64Array(16),
				scale: NaN,
			};
			recording.objects.push(recorded);
			// The raycast of `Object3D` finds nothing.
			if (object.raycast === THREE.Object3D.prototype.raycast) return;
			recording.pickable = true;

			const mesh = object as THREE.Mesh;
			const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
			const position = geometry?.attributes.position as
				| PositionAttribute
				| undefined;
			if (geometry === undefined || position === undefined) {
				recording.always = true;
				return;
			}
			// Only the raycast of `Mesh` is known to hit what the box of its
			// geometry encloses.
			const plainMesh =
				object.raycast === THREE.Mesh.prototype.raycast &&
				mesh.isMesh === true &&
				!(mesh as THREE.SkinnedMesh).isSkinnedMesh &&
				!(mesh as THREE.InstancedMesh).isInstancedMesh &&
				!(mesh as THREE.BatchedMesh).isBatchedMesh &&
				!(mesh as unknown as {isLineSegments2?: boolean})
					.isLineSegments2 &&
				Object.keys(geometry.morphAttributes).length === 0;
			// The raycast of `Line` (also of `LineSegments` and `LineLoop`)
			// and of `Points` find what is closer to the ray than the
			// threshold, divided by the mean of the local scale, in the
			// space of the object.
			const widen =
				object.raycast === THREE.Line.prototype.raycast &&
				(object as THREE.Line).isLine === true
					? recording.lineWiden
					: object.raycast === THREE.Points.prototype.raycast &&
						  (object as THREE.Points).isPoints === true
						? recording.pointsWiden
						: undefined;
			if (!plainMesh && !widen) {
				recording.always = true;
				return;
			}
			if (widen) {
				const scale = object.scale.x + object.scale.y + object.scale.z;
				const mean = Math.abs(scale / 3);
				if (!(mean > 0) || !Number.isFinite(mean)) {
					recording.always = true;
					return;
				}
				recorded.scale = scale;
				// A box grown by r in its own space covers, in the world,
				// the box grown by r times the sum of the absolute values of
				// each row of the world matrix.
				const e = object.matrixWorld.elements;
				const slack = 1 + 1e-6;
				widen.max(
					this._size.set(
						((Math.abs(e[0]) + Math.abs(e[4]) + Math.abs(e[8])) /
							mean) *
							slack,
						((Math.abs(e[1]) + Math.abs(e[5]) + Math.abs(e[9])) /
							mean) *
							slack,
						((Math.abs(e[2]) + Math.abs(e[6]) + Math.abs(e[10])) /
							mean) *
							slack,
					),
				);
			}
			recorded.geometry = geometry;
			recorded.position = position;
			recorded.positionVersion = positionVersion(position);
			recorded.matrix.set(object.matrixWorld.elements);
			const bounds = geometry.boundingBox;
			recorded.boundingBox = bounds;
			if (bounds)
				recorded.boundsKey.set([
					bounds.min.x,
					bounds.min.y,
					bounds.min.z,
					bounds.max.x,
					bounds.max.y,
					bounds.max.z,
				]);
			// `Mesh.raycast` rejects a ray outside the box of the geometry,
			// so that box is exact for a mesh. The raycast of a line or points
			// object never reads it, and it can be stale after the positions
			// changed: their box is the box of the vertices.
			recording.box.union(
				new THREE.Box3()
					.copy(
						widen
							? new THREE.Box3().setFromBufferAttribute(
									position as THREE.BufferAttribute,
								)
							: localBox(geometry, position),
					)
					.applyMatrix4(object.matrixWorld),
			);
		});

		if (
			!Number.isFinite(
				recording.lineWiden.lengthSq() +
					recording.pointsWiden.lengthSq(),
			)
		)
			recording.always = true;
		expandSlightly(recording.box, this._size);
		return recording;
	}

	// #region Instances

	/**
	 * Read every instanced mesh the entries can be hit through, and which
	 * entries each of their occurrences belongs to.
	 */
	private scanInstances(): void {
		this._instancesStale = false;
		this._containers.clear();
		this._occurrences.clear();
		this._instancedEntryKeys.clear();
		const viewportId = this._viewportId;
		for (let i = 0; i < this._leaves.length; i++) {
			const leaf = this._leaves[i];
			leaf.groups = [];
			if (!leaf.instanced) continue;
			const nodeId = leaf.entry.node.id;
			for (const key in leaf.geometryData) {
				const data = leaf.geometryData[key];
				const converted = data.convertedObject[viewportId];
				if (!(converted instanceof THREE.InstancedMesh)) continue;
				const owner = ownerOf(converted);
				let container = this._containers.get(owner);
				if (!container) {
					container = {
						owner,
						children: [],
						meshes: [],
						unbounded: new Set(),
					};
					this._containers.set(owner, container);
				}
				const hash = converted.userData.instanceHash;
				if (
					!leaf.groups.some(
						(group) =>
							group.container === container &&
							group.hash === hash,
					)
				)
					leaf.groups.push({container, hash});
				const entryKey = `${nodeId}:${data.id}`;
				let targets = this._instancedEntryKeys.get(entryKey);
				if (!targets)
					this._instancedEntryKeys.set(entryKey, (targets = []));
				targets.push({
					entry: i,
					hash,
					owner,
				});
			}
		}
		const scan = ++this._scan;
		for (const container of this._containers.values())
			this.scanContainer(container, scan, []);
		this._addedOccurrence = false;
	}

	/**
	 * Read the list of instanced meshes of a container again, and the slots
	 * of the meshes that are new or changed. The occurrences that were in a
	 * mesh that was read again or is gone are added to `removed`: they are
	 * removed unless the scan saw them in another mesh.
	 */
	private scanContainer(
		container: IContainer,
		scan: number,
		removed: IOccurrence[],
	): void {
		const owner = container.owner;
		const list =
			owner instanceof THREE.InstancedMesh && owner.parent === null
				? [owner]
				: owner.children;
		container.children = list.slice();
		const old = new Map(
			container.meshes.map((state) => [state.mesh, state]),
		);
		container.meshes = [];
		for (const child of list) {
			if (!(child instanceof THREE.InstancedMesh)) continue;
			let state = old.get(child);
			if (state) {
				old.delete(child);
				const before = state.occurrences;
				if (this.refreshMesh(state, scan))
					for (const occurrence of before) removed.push(occurrence);
			} else {
				state = this.meshState(child);
				this.refreshMesh(state, scan);
			}
			container.meshes.push(state);
		}
		this.refreshUnbounded(container);
		for (const state of old.values())
			for (const occurrence of state.occurrences)
				removed.push(occurrence);
	}

	/** The instance hashes of the container with a mesh that is not bounded. */
	private refreshUnbounded(container: IContainer): void {
		const unbounded = new Set<unknown>();
		for (const state of container.meshes)
			if (!state.boundable)
				unbounded.add(state.mesh.userData.instanceHash);
		container.unbounded = unbounded;
	}

	private meshState(mesh: THREE.InstancedMesh): IMeshState {
		return {
			mesh,
			attribute: mesh.instanceMatrix,
			version: -1,
			count: -1,
			keys: undefined,
			nodes: undefined,
			raycast: mesh.raycast,
			geometry: mesh.geometry,
			position: undefined,
			positionVersion: -1,
			boundingBox: null,
			boundsKey: new Float64Array(6),
			matrix: new Float64Array(16).fill(NaN),
			local: new THREE.Box3(),
			boundable: false,
			occurrences: [],
		};
	}

	/**
	 * Compare the instanced meshes with their last scan, and read the slots
	 * of the meshes that changed again. Occurrences that moved to another
	 * slot (a highlight moves one to an effect mesh) keep their box.
	 */
	private validateInstances(): {changed: boolean; structural: boolean} {
		if (this._instancesStale) {
			this.scanInstances();
			return {changed: true, structural: true};
		}
		const scan = ++this._scan;
		let structural = false;
		const removed: IOccurrence[] = [];
		for (const container of this._containers.values()) {
			const owner = container.owner;
			const list =
				owner instanceof THREE.InstancedMesh && owner.parent === null
					? undefined
					: owner.children;
			let sameChildren = true;
			if (list) {
				if (list.length !== container.children.length)
					sameChildren = false;
				else
					for (let i = 0; i < list.length; i++)
						if (list[i] !== container.children[i]) {
							sameChildren = false;
							break;
						}
			}
			if (!sameChildren) {
				const unbounded = container.unbounded;
				this.scanContainer(container, scan, removed);
				if (!sameSet(unbounded, container.unbounded)) structural = true;
				continue;
			}
			for (const state of container.meshes) {
				const before = state.occurrences;
				const boundable = state.boundable;
				if (!this.refreshMesh(state, scan)) continue;
				for (const occurrence of before) removed.push(occurrence);
				if (boundable !== state.boundable) {
					this.refreshUnbounded(container);
					structural = true;
				}
			}
		}
		// An occurrence that was in a mesh that changed and is in none now.
		for (const occurrence of removed)
			if (
				occurrence.seen !== scan &&
				this._occurrences.get(occurrence.key) === occurrence
			) {
				this._occurrences.delete(occurrence.key);
				if (occurrence.entries.length > 0) structural = true;
			}
		if (this._addedOccurrence) {
			this._addedOccurrence = false;
			structural = true;
		}
		// Occurrences that only moved to another slot change nothing in
		// the tree.
		const boxChanged = this._boxChanged;
		this._boxChanged = false;
		return {changed: boxChanged || structural, structural};
	}

	/** An occurrence with entries was added since the last tree build. */
	private _addedOccurrence = false;
	/** The box of an occurrence with entries changed since the last check. */
	private _boxChanged = false;

	/**
	 * Read the slots of a mesh again if it changed since its last scan.
	 * Returns whether it was read.
	 */
	private refreshMesh(state: IMeshState, scan: number): boolean {
		const mesh = state.mesh;
		const geometry = mesh.geometry;
		const position = geometry.attributes.position as
			| PositionAttribute
			| undefined;
		const bounds = geometry.boundingBox;
		const elements = mesh.matrixWorld.elements;
		let shapeChanged =
			geometry !== state.geometry ||
			position !== state.position ||
			positionVersion(position) !== state.positionVersion ||
			bounds !== state.boundingBox ||
			(bounds !== null &&
				(bounds.min.x !== state.boundsKey[0] ||
					bounds.min.y !== state.boundsKey[1] ||
					bounds.min.z !== state.boundsKey[2] ||
					bounds.max.x !== state.boundsKey[3] ||
					bounds.max.y !== state.boundsKey[4] ||
					bounds.max.z !== state.boundsKey[5]));
		for (let k = 0; k < 16 && !shapeChanged; k++)
			if (elements[k] !== state.matrix[k]) shapeChanged = true;
		const slotsChanged =
			mesh.instanceMatrix !== state.attribute ||
			mesh.instanceMatrix.version !== state.version ||
			mesh.count !== state.count ||
			mesh.userData.instanceKeys !== state.keys ||
			mesh.userData.instanceNodes !== state.nodes ||
			mesh.raycast !== state.raycast;
		if (!shapeChanged && !slotsChanged) return false;

		state.attribute = mesh.instanceMatrix;
		state.version = mesh.instanceMatrix.version;
		state.count = mesh.count;
		state.keys = mesh.userData.instanceKeys;
		state.nodes = mesh.userData.instanceNodes;
		state.raycast = mesh.raycast;
		if (shapeChanged) {
			state.geometry = geometry;
			state.position = position;
			state.positionVersion = positionVersion(position);
			state.boundingBox = bounds;
			if (bounds)
				state.boundsKey.set([
					bounds.min.x,
					bounds.min.y,
					bounds.min.z,
					bounds.max.x,
					bounds.max.y,
					bounds.max.z,
				]);
			state.matrix.set(elements);
			state.local = position
				? localBox(geometry, position)
				: new THREE.Box3();
		}

		const keys = mesh.userData.instanceKeys as
			| (string | undefined)[]
			| undefined;
		const nodes = mesh.userData.instanceNodes as
			| (ITreeNode | undefined)[]
			| undefined;
		// `InstancedMesh.raycast` is replaced by a test of the occurrences
		// only if it is the one of three.js, and the slots name their node
		// and geometry. A morphed instance moves its vertices outside of
		// the box of the geometry.
		state.boundable =
			mesh.raycast === THREE.InstancedMesh.prototype.raycast &&
			Array.isArray(keys) &&
			Array.isArray(nodes) &&
			position !== undefined &&
			Object.keys(geometry.morphAttributes).length === 0 &&
			!mesh.morphTexture;
		state.occurrences = [];
		if (!state.boundable) return true;

		const array = mesh.instanceMatrix.array;
		for (let slot = 0; slot < mesh.count; slot++) {
			const key = keys![slot];
			const node = nodes![slot];
			if (key === undefined || node === undefined) continue;
			this._instancesChecked++;
			let occurrence = this._occurrences.get(key);
			const offset = slot * 16;
			if (!occurrence) {
				const entries = this.entriesOf(mesh, key, node);
				if (entries === undefined) {
					// A slot the engine could not map to a geometry data of
					// its node: the mesh is tested as a whole.
					state.boundable = false;
					continue;
				}
				occurrence = {
					mesh,
					slot,
					key,
					matrix: new Float32Array(16).fill(NaN),
					box: new THREE.Box3(),
					entries,
					seen: scan,
				};
				this._occurrences.set(key, occurrence);
				if (entries.length > 0) this._addedOccurrence = true;
			}
			// An occurrence that moved to another mesh (a highlight moves it
			// to an effect mesh) gets its box from that mesh.
			let same = !shapeChanged && occurrence.mesh === mesh;
			occurrence.mesh = mesh;
			occurrence.slot = slot;
			occurrence.seen = scan;
			const matrix = occurrence.matrix;
			for (let k = 0; k < 16 && same; k++)
				if (array[offset + k] !== matrix[k]) same = false;
			if (!same) {
				for (let k = 0; k < 16; k++) matrix[k] = array[offset + k];
				const world = this._slotMatrix
					.fromArray(array, offset)
					.premultiply(mesh.matrixWorld);
				occurrence.box.copy(state.local).applyMatrix4(world);
				expandSlightly(occurrence.box, this._size);
				if (occurrence.entries.length > 0) this._boxChanged = true;
			}
			state.occurrences.push(occurrence);
		}
		return true;
	}

	/**
	 * The entries a slot can give a hit to: the entry of its node with that
	 * geometry data, and the entries of the ancestors of the node that hold
	 * the same geometry data, if the mesh is one their test reads.
	 * Undefined if the key does not name the node of the slot.
	 */
	private entriesOf(
		mesh: THREE.InstancedMesh,
		key: string,
		node: ITreeNode,
	): number[] | undefined {
		const prefix = node.id + ":";
		if (!key.startsWith(prefix)) return undefined;
		const geometryId = key.slice(prefix.length);
		const hash = mesh.userData.instanceHash;
		const owner = ownerOf(mesh);
		const entries: number[] = [];
		for (
			let current: ITreeNode | undefined = node;
			current;
			current = current.parent
		) {
			const targets = this._instancedEntryKeys.get(
				current === node ? key : `${current.id}:${geometryId}`,
			);
			if (!targets) continue;
			for (const target of targets)
				if (target.hash === hash && target.owner === owner)
					entries.push(target.entry);
		}
		return entries;
	}

	// #endregion Instances

	private buildTree(): void {
		this._dirty = false;
		this._alwaysKey = this.alwaysKey();
		this._addedOccurrence = false;
		const items: IItem[] = [];
		this._leaves.forEach((leaf, index) => {
			if (!leaf.recording.box.isEmpty()) items.push({entry: index});
		});
		for (const occurrence of this._occurrences.values())
			if (occurrence.entries.length > 0 && !occurrence.box.isEmpty())
				items.push({entry: occurrence.entries[0], occurrence});
		this._items = items;
		this._root =
			items.length > 0 ? this.split(items.map((_, i) => i)) : undefined;
	}

	private itemBox(item: IItem): THREE.Box3 {
		return item.occurrence
			? item.occurrence.box
			: this._leaves[item.entry].recording.box;
	}

	/** Add the box and widening of an item to a node of the tree. */
	private addItem(node: IHierarchyNode, item: IItem): void {
		node.box.union(this.itemBox(item));
		if (item.occurrence) return;
		const recording = this._leaves[item.entry].recording;
		node.lineWiden.max(recording.lineWiden);
		node.pointsWiden.max(recording.pointsWiden);
	}

	/** Fit the boxes of the tree to the boxes of the items, bottom-up. */
	private refit(node: IHierarchyNode): void {
		node.box.makeEmpty();
		node.lineWiden.set(0, 0, 0);
		node.pointsWiden.set(0, 0, 0);
		if (node.items) {
			for (const index of node.items)
				this.addItem(node, this._items[index]);
			return;
		}
		for (const child of [node.left, node.right])
			if (child) {
				this.refit(child);
				node.box.union(child.box);
				node.lineWiden.max(child.lineWiden);
				node.pointsWiden.max(child.pointsWiden);
			}
	}

	private split(indices: number[]): IHierarchyNode {
		const node: IHierarchyNode = {
			box: new THREE.Box3(),
			lineWiden: new THREE.Vector3(),
			pointsWiden: new THREE.Vector3(),
		};
		for (const index of indices) this.addItem(node, this._items[index]);
		if (indices.length <= LEAVES_PER_NODE) {
			node.items = indices;
			return node;
		}

		node.box.getSize(this._size);
		const axis: "x" | "y" | "z" =
			this._size.x >= this._size.y && this._size.x >= this._size.z
				? "x"
				: this._size.y >= this._size.z
					? "y"
					: "z";
		const key = (index: number) =>
			this.itemBox(this._items[index]).getCenter(this._center)[axis];
		const sorted = [...indices].sort((a, b) => key(a) - key(b));
		const middle = sorted.length >> 1;
		node.left = this.split(sorted.slice(0, middle));
		node.right = this.split(sorted.slice(middle));
		return node;
	}
}
