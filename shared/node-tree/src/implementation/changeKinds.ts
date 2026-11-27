import {
	type ITreeNode,
	type ITreeNodeData,
	type SceneNodeChangeKind,
} from "@shapediver/viewer.shared.types";

/**
 * The change kinds of a tree node in a fixed order. A kind's index is its
 * slot in `TreeNode.changeSerials` and its bit (`1 << index`) in a set of
 * kinds.
 *
 * @internal
 */
export const SCENE_NODE_CHANGE_KINDS: readonly SceneNodeChangeKind[] =
	Object.freeze([
		"geometry",
		"material",
		"transformation",
		"visibility",
		"structure",
		"light",
		"camera",
	]);

/** @internal The index of each kind in {@link SCENE_NODE_CHANGE_KINDS}. */
export const SCENE_NODE_CHANGE_KIND_INDEX: Readonly<
	Record<SceneNodeChangeKind, number>
> = Object.freeze({
	geometry: 0,
	material: 1,
	transformation: 2,
	visibility: 3,
	structure: 4,
	light: 5,
	camera: 6,
});

/** The methods of `TreeNode` that the scene update uses. */
interface IChangeTrackedNode {
	changedKindsSince(serial: number): number;
	noteChange(kind: SceneNodeChangeKind): void;
}

/**
 * The kinds (bits) that `node` changed after the clock value `serial`.
 * `0` for a node of another implementation of `ITreeNode`. Duck-typed: a
 * feature bundle carries its own copy of the `TreeNode` class.
 *
 * @internal
 */
export function changedKindsSince(node: ITreeNode, serial: number): number {
	const tracked = node as Partial<IChangeTrackedNode>;
	return tracked.changedKindsSince ? tracked.changedKindsSince(serial) : 0;
}

/** The log of changed children of `TreeNode` that the scene update reads. */
interface IChildLoggingNode {
	readonly changedChildren: readonly {
		readonly child: ITreeNode;
		readonly serial: number;
		readonly removed: boolean;
	}[];
	readonly changedChildrenReset: number;
}

/**
 * The children of `node` that got a new version, were added or were removed
 * after the clock value `serial`, the newest entry of each, oldest first.
 * `undefined` when the log cannot tell (a node of another implementation of
 * `ITreeNode`, or the log overflowed after `serial`): look at all children.
 * Costs the entries after `serial`, not the children. Duck-typed, as
 * {@link changedKindsSince}.
 *
 * @internal
 */
export function changedChildrenSince(
	node: ITreeNode,
	serial: number,
): {child: ITreeNode; removed: boolean}[] | undefined {
	const logging = node as Partial<IChildLoggingNode>;
	const log = logging.changedChildren;
	if (log === undefined || logging.changedChildrenReset! > serial) return;
	const result: {child: ITreeNode; removed: boolean}[] = [];
	let seen: Set<ITreeNode> | undefined;
	for (let i = log.length - 1; i >= 0; i--) {
		const entry = log[i];
		if (entry.serial <= serial) break;
		if (result.length > 0) {
			seen ??= new Set(result.map((r) => r.child));
			if (seen.has(entry.child)) continue;
			seen.add(entry.child);
		}
		result.push({child: entry.child, removed: entry.removed});
	}
	return result.reverse();
}

/**
 * Records a change of `kind` on `node` that no setter of the node saw, for
 * example a matrix changed in place.
 *
 * @internal
 */
export function noteNodeChange(
	node: ITreeNode,
	kind: SceneNodeChangeKind,
): void {
	(node as Partial<IChangeTrackedNode>).noteChange?.(kind);
}

/**
 * What a change of `data` changes on the nodes that hold it: its
 * `changeKind` (`AbstractTreeNodeData`), `"geometry"` for data of another
 * implementation.
 *
 * @internal
 */
export function dataChangeKind(
	data: ITreeNodeData,
): SceneNodeChangeKind | undefined {
	return "changeKind" in data
		? (data as {changeKind: SceneNodeChangeKind | undefined}).changeKind
		: "geometry";
}

const kindLists: (readonly SceneNodeChangeKind[] | undefined)[] = [];

/**
 * The frozen list of the kinds in a set of bits, in the order of
 * {@link SCENE_NODE_CHANGE_KINDS}. The same array for the same bits.
 *
 * @internal
 */
export function changeKindsOfBits(
	bits: number,
): readonly SceneNodeChangeKind[] {
	let list = kindLists[bits];
	if (!list) {
		list = Object.freeze(
			SCENE_NODE_CHANGE_KINDS.filter((_, i) => bits & (1 << i)),
		);
		kindLists[bits] = list;
	}
	return list;
}
