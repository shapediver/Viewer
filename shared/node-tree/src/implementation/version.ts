/**
 * The change clock of the scene tree.
 *
 * Every version of a tree node or of its data, every change kind a node
 * records (`TreeNode.changeSerials`) and every value a viewport records when
 * it applies a change is a value of this one clock. The counter is shared by
 * all copies of this module (the UMD bundles of the viewer and its features
 * each carry one) through a symbol on the global object.
 */
interface ClockHolder {
	/** The last value given out. */
	n: number;
	/** The value of the clock when the tree was last read (see markTreeRead). */
	read: number;
}

const clock: ClockHolder = (() => {
	const key = Symbol.for("shapediver.viewer.treeVersion");
	const holder = globalThis as unknown as Record<symbol, ClockHolder>;
	const value = (holder[key] ??= {n: 0, read: 0});
	// A holder of an older copy of this module has no read marker yet.
	value.read ??= 0;
	return value;
})();

/**
 * The next value of the clock. Values only have to be compared: a larger
 * value is later.
 *
 * @internal
 */
export function nextSerial(): number {
	return ++clock.n;
}

/**
 * The last value given out by {@link nextSerial}, without advancing.
 *
 * @internal
 */
export function currentSerial(): number {
	return clock.n;
}

/**
 * The next version of a tree node or of its data: `"v"` and the next value
 * of the clock. Versions only have to differ: every reader compares them
 * for equality.
 */
export function nextVersion(): string {
	return "v" + ++clock.n;
}

/**
 * The number of a version made by {@link nextVersion}, `0` for any other
 * string.
 *
 * @internal
 */
export function serialOfVersion(version: string): number {
	if (version.charCodeAt(0) !== 118 /* "v" */) return 0;
	const n = Number(version.slice(1));
	return Number.isInteger(n) && n > 0 ? n : 0;
}

/**
 * Marks that the tree is read from now on: a change made after this call
 * has to be recorded. A viewport calls it at the start of every scene
 * update and every direct node update.
 *
 * @internal
 */
export function markTreeRead(): void {
	clock.read = clock.n;
}

/**
 * The value of the clock at the last {@link markTreeRead}. A node created
 * after it has not been read by anyone yet.
 *
 * @internal
 */
export function lastReadSerial(): number {
	return clock.read;
}
