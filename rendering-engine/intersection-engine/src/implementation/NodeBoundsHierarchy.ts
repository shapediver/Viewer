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
	/** Set for a mesh that a box stands in for, null for any other object. */
	geometry: THREE.BufferGeometry | null;
	position: PositionAttribute | null;
	positionVersion: number;
	/** The box three.js reads in `Mesh.raycast` (null: it skips the box test). */
	boundingBox: THREE.Box3 | null;
	/** Min and max of `boundingBox` when it was recorded. */
	boundsKey: Float64Array;
	matrix: Float64Array;
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
	/** The union of the world boxes of the meshes. Empty if there are none. */
	box: THREE.Box3;
	/** The entries that share this recording. */
	entries: number[];
}

interface ILeaf {
	entry: INodeBoundsEntry;
	geometryData: {[key: string]: GeometryData};
	/** One of the geometry data of the entry converts to an instanced mesh. */
	instanced: boolean;
	recording: IRecording;
	always: boolean;
}

interface IHierarchyNode {
	box: THREE.Box3;
	left?: IHierarchyNode;
	right?: IHierarchyNode;
	/** Entry indices, for a node without children. */
	leaves?: number[];
}

/**
 * Work counts of the validation. They are written only if a test put the
 * object there first (`globalThis.__nodeBoundsStats`, see the `picking`
 * counter of the performance tests): the module publishes nothing itself.
 */
interface IStats {
	queries: number;
	objectsChecked: number;
	rebuilds: number;
}

function testStats(): IStats | undefined {
	return (globalThis as {__nodeBoundsStats?: IStats}).__nodeBoundsStats;
}

const LEAVES_PER_NODE = 4;
const BOX_EXPANSION = 1e-6;

/**
 * A bounds hierarchy over the nodes a pick tests (one leaf per entry), so a
 * ray only visits the nodes whose bounds it can hit instead of every node.
 *
 * The leaf of a node covers every object below its converted object, hidden
 * source meshes of batched members included: their boxes stand in for the
 * members of the batch. A mesh is bounded only if its raycast is exactly
 * the one of `Mesh`. An object with any other raycast (a line, points, a
 * sprite, a subclass, a wrapped function) makes the node a candidate for
 * every ray, and so does an instanced, skinned or morphed mesh, a `Line2`
 * or an instanced geometry data. An object with the raycast of `Object3D`
 * finds nothing and is not looked at.
 *
 * Nothing tells the hierarchy that a node moved or that its geometry was
 * replaced: `updateNode`, `updateNodeTransformation`, dragging and
 * animations do not emit `VIEWPORT_UPDATED`. So every query first compares
 * what it recorded (parent, child count, raycast function, geometry,
 * position attribute version, bounding box, world matrix) with the scene,
 * once per node, and records the nodes that differ again. The boxes of the
 * tree are then fitted to the new boxes, or the tree is built again if a
 * node started or stopped being bounded. The answer is exactly the nodes
 * the plain loop would have given results for, in the same order.
 *
 * The hierarchy never writes into three.js objects: the box of a mesh whose
 * geometry has none is computed into a box of its own.
 */
export class NodeBoundsHierarchy {
	/** Objects compared with the scene since the last query was counted. */
	private _checked = 0;
	private _entries: INodeBoundsEntry[] = [];
	private _leaves: ILeaf[] = [];
	private _recordings: IRecording[] = [];
	private _always: number[] = [];
	private _alwaysKey = "";
	private _root: IHierarchyNode | undefined;
	private _dirty = true;

	private readonly _size = new THREE.Vector3();
	private readonly _center = new THREE.Vector3();

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
	 */
	public candidates(ray: THREE.Ray): number[] {
		this.validate();
		const stats = testStats();
		if (stats) {
			stats.queries++;
			stats.objectsChecked += this._checked;
		}
		this._checked = 0;

		const found = new Set<number>(this._always);
		const stack: IHierarchyNode[] = this._root ? [this._root] : [];
		while (stack.length > 0) {
			const current = stack.pop()!;
			if (!ray.intersectsBox(current.box)) continue;
			if (current.leaves)
				for (const leaf of current.leaves) found.add(leaf);
			else {
				if (current.left) stack.push(current.left);
				if (current.right) stack.push(current.right);
			}
		}
		const result: number[] = [];
		for (const index of found) {
			const leaf = this._leaves[index];
			// A leaf that can only be hit through its box is a candidate if
			// the ray hits that box.
			if (leaf.always || ray.intersectsBox(leaf.recording.box))
				result.push(index);
		}
		return result.sort((a, b) => a - b);
	}

	private validate(): void {
		if (this._dirty || this._leaves.length !== this._entries.length) {
			this.buildAll();
			return;
		}
		let stale = false;
		let structural = false;
		const viewportId = this._viewportId;
		for (let r = 0; r < this._recordings.length; r++) {
			const recording = this._recordings[r];
			if (this.isCurrent(recording)) continue;
			const fresh = this.record(recording.node, recording.entries);
			this._recordings[r] = fresh;
			stale = true;
			if (fresh.box.isEmpty() !== recording.box.isEmpty())
				structural = true;
			for (const index of recording.entries)
				this._leaves[index].recording = fresh;
		}
		// The geometry data of an entry can be replaced (the interaction
		// feature does so on an update of a node), and an entry can start or
		// stop converting to an instanced mesh.
		for (let i = 0; i < this._leaves.length; i++) {
			const leaf = this._leaves[i];
			const geometryData = leaf.entry.geometryData;
			let instanced = false;
			for (const key in geometryData)
				if (
					geometryData[key].convertedObject[viewportId] instanceof
					THREE.InstancedMesh
				) {
					instanced = true;
					break;
				}
			if (
				geometryData === leaf.geometryData &&
				instanced === leaf.instanced
			)
				continue;
			leaf.geometryData = geometryData;
			leaf.instanced = instanced;
			stale = true;
		}
		if (!stale) return;
		const stats = testStats();
		if (stats) stats.rebuilds++;
		this.setAlways();
		const alwaysChanged = this.alwaysKey() !== this._alwaysKey;
		if (structural || alwaysChanged || !this._root) this.buildTree();
		else this.refit(this._root);
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
				((position as THREE.InterleavedBufferAttribute)
					.isInterleavedBufferAttribute
					? (position as THREE.InterleavedBufferAttribute).data
							.version
					: (position as THREE.BufferAttribute).version) !==
					recorded.positionVersion
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
					recording,
					always: false,
				};
			}
		}
		this.setAlways();
		this.buildTree();
	}

	private setAlways(): void {
		const always: number[] = [];
		this._leaves.forEach((leaf, index) => {
			// Without a converted object there is nothing to bound, and the
			// engine may still find an instanced or batched hit for it.
			leaf.always =
				leaf.recording.always || leaf.instanced || !leaf.recording.root;
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
			box: new THREE.Box3(),
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
			};
			recording.objects.push(recorded);
			// The raycast of `Object3D` finds nothing.
			if (object.raycast === THREE.Object3D.prototype.raycast) return;

			const mesh = object as THREE.Mesh;
			const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
			const position = geometry?.attributes.position as
				| PositionAttribute
				| undefined;
			// Only the raycast of `Mesh` is known to hit what the box of its
			// geometry encloses.
			const plain =
				object.raycast === THREE.Mesh.prototype.raycast &&
				mesh.isMesh === true &&
				!(mesh as THREE.SkinnedMesh).isSkinnedMesh &&
				!(mesh as THREE.InstancedMesh).isInstancedMesh &&
				!(mesh as THREE.BatchedMesh).isBatchedMesh &&
				!(mesh as unknown as {isLineSegments2?: boolean})
					.isLineSegments2 &&
				geometry !== undefined &&
				position !== undefined &&
				Object.keys(geometry.morphAttributes).length === 0;
			if (!plain) {
				recording.always = true;
				return;
			}
			recorded.geometry = geometry!;
			recorded.position = position!;
			recorded.positionVersion = (
				position as THREE.InterleavedBufferAttribute
			).isInterleavedBufferAttribute
				? (position as THREE.InterleavedBufferAttribute).data.version
				: (position as THREE.BufferAttribute).version;
			recorded.matrix.set(object.matrixWorld.elements);
			// The box of the geometry, as `Mesh.raycast` reads it. If there
			// is none, three.js skips its box test, so the box of the
			// vertices is computed into a box of our own. The geometry is
			// not written to: that would make three.js reject rays against a
			// box that goes stale.
			const bounds = geometry!.boundingBox;
			recorded.boundingBox = bounds;
			let local: THREE.Box3;
			if (bounds) {
				recorded.boundsKey.set([
					bounds.min.x,
					bounds.min.y,
					bounds.min.z,
					bounds.max.x,
					bounds.max.y,
					bounds.max.z,
				]);
				local = bounds;
			} else
				local = new THREE.Box3().setFromBufferAttribute(
					// It only calls getX, getY and getZ, which both kinds have.
					position as THREE.BufferAttribute,
				);
			recording.box.union(
				new THREE.Box3().copy(local).applyMatrix4(object.matrixWorld),
			);
		});

		if (!recording.box.isEmpty()) {
			recording.box.getSize(this._size);
			recording.box.expandByScalar(
				BOX_EXPANSION * this._size.length() + 1e-9,
			);
		}
		return recording;
	}

	private buildTree(): void {
		this._dirty = false;
		this._alwaysKey = this.alwaysKey();
		const bounded: number[] = [];
		this._leaves.forEach((leaf, index) => {
			if (!leaf.recording.box.isEmpty()) bounded.push(index);
		});
		this._root = bounded.length > 0 ? this.split(bounded) : undefined;
	}

	/** Fit the boxes of the tree to the boxes of the leaves, bottom-up. */
	private refit(node: IHierarchyNode): void {
		node.box.makeEmpty();
		if (node.leaves) {
			for (const index of node.leaves)
				node.box.union(this._leaves[index].recording.box);
			return;
		}
		for (const child of [node.left, node.right])
			if (child) {
				this.refit(child);
				node.box.union(child.box);
			}
	}

	private split(indices: number[]): IHierarchyNode {
		const box = new THREE.Box3();
		for (const index of indices)
			box.union(this._leaves[index].recording.box);
		if (indices.length <= LEAVES_PER_NODE) return {box, leaves: indices};

		box.getSize(this._size);
		const axis: "x" | "y" | "z" =
			this._size.x >= this._size.y && this._size.x >= this._size.z
				? "x"
				: this._size.y >= this._size.z
					? "y"
					: "z";
		const key = (index: number) =>
			this._leaves[index].recording.box.getCenter(this._center)[axis];
		const sorted = [...indices].sort((a, b) => key(a) - key(b));
		const middle = sorted.length >> 1;
		return {
			box,
			left: this.split(sorted.slice(0, middle)),
			right: this.split(sorted.slice(middle)),
		};
	}
}
