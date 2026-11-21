import {
	type ISceneChanges,
	type ITreeNode,
} from "@shapediver/viewer.shared.types";

/** A node and what the index computed for it. */
export interface ITreeNodeIndexEntry<T> {
	node: ITreeNode;
	value: T;
}

/**
 * What a listener of the scene tree keeps about the nodes of the tree, kept
 * up to date from the nodes a scene update went through
 * ({@link ISceneChanges}) instead of by reading the whole tree each time.
 *
 * `compute` gives the value of one node, or `undefined` if the node does not
 * belong in the index. It reads only that node. `equals` decides if a new
 * value is the one that is already there: then nothing changes, and the
 * `version` stays.
 *
 * The `version` changes when a node enters or leaves the index or when the
 * value of a node changes. A listener that derives something from the index
 * (a list, a lookup) builds it again only when the version differs from the
 * one it built it for.
 */
export class TreeNodeIndex<T> {
	private readonly _entries = new Map<string, ITreeNodeIndexEntry<T>>();
	/** The entries in tree order, or `undefined` if they were not listed yet. */
	private _ordered: ITreeNodeIndexEntry<T>[] | undefined;
	/** What the next list of entries has to do: nothing, filter or walk. */
	private _order: "kept" | "filter" | "walk" = "walk";
	private _version = 0;

	constructor(
		private readonly _compute: (node: ITreeNode) => T | undefined,
		private readonly _equals: (a: T, b: T) => boolean = Object.is,
	) {}

	/** Changes when a node enters or leaves, or when a value changes. */
	public get version(): number {
		return this._version;
	}

	public get size(): number {
		return this._entries.size;
	}

	public get(id: string): ITreeNodeIndexEntry<T> | undefined {
		return this._entries.get(id);
	}

	/**
	 * Apply what a scene update went through. A node of `removedNodeIds` is
	 * dropped if it is not attached to the tree of `root` any more, and
	 * computed again if it is (it can have been moved). Then every attached
	 * node of `changes.nodes` is computed again.
	 */
	public apply(changes: ISceneChanges, root: ITreeNode): void {
		for (const id of changes.removedNodeIds) {
			const entry = this._entries.get(id);
			if (!entry) continue;
			if (this.isAttached(entry.node, root)) this.update(entry.node);
			else this.remove(id);
		}
		for (const node of changes.nodes)
			if (this.isAttached(node, root)) this.update(node);
	}

	/** The entries in tree order. */
	public entries(root: ITreeNode): readonly ITreeNodeIndexEntry<T>[] {
		if (this._ordered === undefined || this._order === "walk") {
			const ordered: ITreeNodeIndexEntry<T>[] = [];
			// Reads the structure only, never the data of a node.
			root.traverse((node) => {
				const entry = this._entries.get(node.id);
				if (entry && entry.node === node) ordered.push(entry);
			});
			this._ordered = ordered;
		} else if (this._order === "filter") {
			this._ordered = this._ordered.filter(
				(entry) => this._entries.get(entry.node.id) === entry,
			);
		}
		this._order = "kept";
		return this._ordered;
	}

	/** Compute every node of the tree again. */
	public rebuild(root: ITreeNode): void {
		this._entries.clear();
		root.traverse((node) => {
			const value = this._compute(node);
			if (value !== undefined) this._entries.set(node.id, {node, value});
		});
		this._ordered = undefined;
		this._order = "walk";
		this._version++;
	}

	private isAttached(node: ITreeNode, root: ITreeNode): boolean {
		let current: ITreeNode = node;
		while (current.parent) current = current.parent;
		return current === root;
	}

	private remove(id: string): void {
		if (!this._entries.delete(id)) return;
		if (this._order === "kept") this._order = "filter";
		this._version++;
	}

	private update(node: ITreeNode): void {
		const value = this._compute(node);
		const entry = this._entries.get(node.id);
		if (value === undefined) {
			this.remove(node.id);
			return;
		}
		if (entry && entry.node === node) {
			if (this._equals(entry.value, value)) return;
			// The list of entries holds this object: the order stays.
			entry.value = value;
			this._version++;
			return;
		}
		this._entries.set(node.id, {node, value});
		this._order = "walk";
		this._version++;
	}
}
