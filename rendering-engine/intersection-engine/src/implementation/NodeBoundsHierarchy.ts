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

/** What the hierarchy knew about one object of a leaf when it was built. */
interface IRecordedObject {
	object: THREE.Object3D;
	parent: THREE.Object3D | null;
	childCount: number;
	/** The raycast function, which the interaction feature swaps while it picks. */
	raycast: THREE.Object3D["raycast"];
	geometry: THREE.BufferGeometry | null;
	position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null;
	positionVersion: number;
	/** The box three.js reads in `Mesh.raycast`, and its values. */
	boundingBox: THREE.Box3 | null;
	boundsKey: Float64Array;
	matrix: Float64Array;
	/** The world box of a plain mesh. Null for an object that is always tested. */
	box: THREE.Box3 | null;
}

interface ILeaf {
	entry: INodeBoundsEntry;
	geometryData: {[key: string]: GeometryData};
	root: THREE.Object3D | undefined;
	objects: IRecordedObject[];
	/** The leaf holds something a box cannot stand in for. */
	always: boolean;
	/** One of the geometry data of the entry converts to an instanced mesh. */
	instanced: boolean;
	/** The union of the boxes of the plain meshes. Empty if there are none. */
	box: THREE.Box3;
}

interface IHierarchyNode {
	box: THREE.Box3;
	left?: IHierarchyNode;
	right?: IHierarchyNode;
	/** Leaf indices, for a node without children. */
	leaves?: number[];
}

const LEAVES_PER_NODE = 4;
const BOX_EXPANSION = 1e-6;

/**
 * A group or another object that is not drawn finds nothing. Its raycast is
 * the one of `Object3D`, or takes no arguments, where every raycast that can
 * hit something takes the raycaster and the list of hits. The kinds that
 * can be hit are never decided by that: a tool may wrap their raycast.
 */
function raycastsNothing(object: THREE.Object3D): boolean {
	if (object.raycast === THREE.Object3D.prototype.raycast) return true;
	const kind = object as unknown as {
		isMesh?: boolean;
		isLine?: boolean;
		isPoints?: boolean;
		isSprite?: boolean;
		isLOD?: boolean;
		isLineSegments2?: boolean;
	};
	return (
		!kind.isMesh &&
		!kind.isLine &&
		!kind.isPoints &&
		!kind.isSprite &&
		!kind.isLOD &&
		!kind.isLineSegments2 &&
		object.raycast.length === 0
	);
}

/** The raycast is the one the object's class defines, not one set on it. */
function hasOwnRaycast(object: THREE.Object3D): boolean {
	return Object.prototype.hasOwnProperty.call(object, "raycast");
}

/**
 * A bounds hierarchy over the nodes a pick tests (one leaf per node), so a
 * ray only visits the nodes whose bounds it can hit instead of every node.
 *
 * The leaf of a node covers every object below its converted object, hidden
 * source meshes of batched members included: their boxes stand in for the
 * members of the batch. A node that holds something a box cannot stand in
 * for (a line, points, a sprite, an instanced, skinned or morphed mesh, a
 * mesh with its own raycast) is a candidate for every ray.
 *
 * Nothing tells the hierarchy that a node moved or that its geometry was
 * replaced: `updateNode`, `updateNodeTransformation`, dragging and
 * animations do not emit `VIEWPORT_UPDATED`. So every query first compares
 * what it recorded (parent, child count, geometry, position attribute
 * version, world matrix) with the scene and rebuilds the leaves that
 * differ. The hierarchy then answers with exactly the nodes the plain loop
 * would have given results for, in the same order.
 */
export class NodeBoundsHierarchy {
	/** Work done by the validation, for tests and counters. */
	public static readonly stats = {queries: 0, objectsChecked: 0, rebuilds: 0};

	private _entries: INodeBoundsEntry[] = [];
	private _leaves: ILeaf[] = [];
	private _always: number[] = [];
	private _root: IHierarchyNode | undefined;
	private _dirty = true;

	private readonly _box = new THREE.Box3();
	private readonly _diagonal = new THREE.Vector3();

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
		NodeBoundsHierarchy.stats.queries++;
		this.validate();

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
			if (leaf.always || ray.intersectsBox(leaf.box)) result.push(index);
		}
		return result.sort((a, b) => a - b);
	}

	private validate(): void {
		if (this._dirty || this._leaves.length !== this._entries.length) {
			this._leaves = this._entries.map((entry) => this.buildLeaf(entry));
			this.buildTree();
			return;
		}
		let stale = false;
		let structural = false;
		for (let i = 0; i < this._leaves.length; i++) {
			const old = this._leaves[i];
			if (!this.isCurrent(old)) {
				const leaf = this.buildLeaf(this._entries[i]);
				this._leaves[i] = leaf;
				stale = true;
				// Which leaves are in the tree, and which are always tested,
				// decides its shape. Otherwise only the boxes move.
				if (
					leaf.always !== old.always ||
					leaf.box.isEmpty() !== old.box.isEmpty()
				)
					structural = true;
			}
		}
		if (!stale) return;
		NodeBoundsHierarchy.stats.rebuilds++;
		if (structural || !this._root) this.buildTree();
		else this.refit(this._root);
	}

	private isCurrent(leaf: ILeaf): boolean {
		const entry = leaf.entry;
		if (entry.geometryData !== leaf.geometryData) return false;
		const root = entry.node.convertedObject[this._viewportId] as
			| THREE.Object3D
			| undefined;
		if (root !== leaf.root) return false;
		if (this.hasInstancedGeometry(entry) !== leaf.instanced) return false;
		for (const recorded of leaf.objects) {
			NodeBoundsHierarchy.stats.objectsChecked++;
			const object = recorded.object;
			if (
				object.parent !== recorded.parent ||
				object.children.length !== recorded.childCount ||
				object.raycast !== recorded.raycast
			)
				return false;
			if (recorded.box === null) continue;
			const mesh = object as THREE.Mesh;
			const geometry = mesh.geometry;
			if (geometry !== recorded.geometry) return false;
			const position = geometry.getAttribute("position") as
				| THREE.BufferAttribute
				| THREE.InterleavedBufferAttribute
				| undefined;
			if (
				(position ?? null) !== recorded.position ||
				(position && this.attributeVersion(position)) !==
					(recorded.position ? recorded.positionVersion : undefined)
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
			for (let k = 0; k < 16; k++)
				if (elements[k] !== recorded.matrix[k]) return false;
		}
		return true;
	}

	private attributeVersion(
		attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
	): number {
		return (attribute as THREE.InterleavedBufferAttribute)
			.isInterleavedBufferAttribute
			? (attribute as THREE.InterleavedBufferAttribute).data.version
			: (attribute as THREE.BufferAttribute).version;
	}

	private hasInstancedGeometry(entry: INodeBoundsEntry): boolean {
		for (const key in entry.geometryData)
			if (
				entry.geometryData[key].convertedObject[
					this._viewportId
				] instanceof THREE.InstancedMesh
			)
				return true;
		return false;
	}

	private buildLeaf(entry: INodeBoundsEntry): ILeaf {
		const root = entry.node.convertedObject[this._viewportId] as
			| THREE.Object3D
			| undefined;
		const instanced = this.hasInstancedGeometry(entry);
		const leaf: ILeaf = {
			entry,
			geometryData: entry.geometryData,
			root,
			objects: [],
			// Without a converted object there is nothing to bound, and the
			// engine may still find an instanced or batched hit for it.
			always: !root || instanced,
			instanced,
			box: new THREE.Box3(),
		};
		if (!root) return leaf;

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
				box: null,
			};
			if (raycastsNothing(object)) {
				leaf.objects.push(recorded);
				return;
			}
			const mesh = object as THREE.Mesh;
			const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
			const position = geometry?.getAttribute("position") as
				| THREE.BufferAttribute
				| THREE.InterleavedBufferAttribute
				| undefined;
			const plain =
				mesh.isMesh === true &&
				!hasOwnRaycast(object) &&
				!(mesh as THREE.SkinnedMesh).isSkinnedMesh &&
				!(mesh as THREE.InstancedMesh).isInstancedMesh &&
				!(mesh as THREE.BatchedMesh).isBatchedMesh &&
				!(mesh as unknown as {isLineSegments2?: boolean})
					.isLineSegments2 &&
				geometry !== undefined &&
				position !== undefined &&
				Object.keys(geometry.morphAttributes).length === 0;
			if (!plain) {
				leaf.always = true;
				leaf.objects.push(recorded);
				return;
			}
			if (geometry!.boundingBox === null) geometry!.computeBoundingBox();
			recorded.geometry = geometry!;
			recorded.position = position!;
			recorded.positionVersion = this.attributeVersion(position!);
			recorded.boundingBox = geometry!.boundingBox;
			recorded.boundsKey.set([
				...geometry!.boundingBox!.min.toArray(),
				...geometry!.boundingBox!.max.toArray(),
			]);
			recorded.matrix.set(object.matrixWorld.elements);
			recorded.box = new THREE.Box3()
				.copy(geometry!.boundingBox!)
				.applyMatrix4(object.matrixWorld);
			leaf.box.union(recorded.box);
			leaf.objects.push(recorded);
		});

		if (!leaf.box.isEmpty()) {
			this._box.copy(leaf.box).getSize(this._diagonal);
			const expand = BOX_EXPANSION * this._diagonal.length() + 1e-9;
			leaf.box.expandByScalar(expand);
		}
		return leaf;
	}

	private buildTree(): void {
		this._dirty = false;
		this._always = [];
		const bounded: number[] = [];
		this._leaves.forEach((leaf, index) => {
			if (leaf.always) this._always.push(index);
			if (!leaf.box.isEmpty()) bounded.push(index);
		});
		this._root = bounded.length > 0 ? this.split(bounded) : undefined;
	}

	/** Fit the boxes of the tree to the boxes of the leaves, bottom-up. */
	private refit(node: IHierarchyNode): void {
		node.box.makeEmpty();
		if (node.leaves) {
			for (const index of node.leaves)
				node.box.union(this._leaves[index].box);
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
		for (const index of indices) box.union(this._leaves[index].box);
		if (indices.length <= LEAVES_PER_NODE) return {box, leaves: indices};

		const size = box.getSize(new THREE.Vector3());
		const axis: "x" | "y" | "z" =
			size.x >= size.y && size.x >= size.z
				? "x"
				: size.y >= size.z
					? "y"
					: "z";
		const center = new THREE.Vector3();
		const key = (index: number) =>
			this._leaves[index].box.getCenter(center)[axis];
		const sorted = [...indices].sort((a, b) => key(a) - key(b));
		const middle = sorted.length >> 1;
		return {
			box,
			left: this.split(sorted.slice(0, middle)),
			right: this.split(sorted.slice(middle)),
		};
	}
}
