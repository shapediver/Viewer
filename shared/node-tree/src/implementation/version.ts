/**
 * The next version of a tree node or of its data. Versions only have to
 * differ: every reader compares them for equality. The counter is shared by
 * all copies of this module (the UMD bundles of the viewer and its features
 * each carry one) through a symbol on the global object.
 */
export function nextVersion(): string {
	const key = Symbol.for("shapediver.viewer.treeVersion");
	const holder = globalThis as unknown as Record<symbol, {n: number}>;
	const counter = (holder[key] ??= {n: 0});
	return "v" + ++counter.n;
}
