import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10382 updateVersion creates one uuid per node", async ({page}) => {
	await open(page);
	const created = await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const nodes = [new SDV.TreeNode("n0")];
		for (let i = 1; i < 32; i++)
			nodes.push(new SDV.TreeNode(`n${i}`, nodes[i - 1]));
		let createdIds = 0;
		const original = crypto.randomUUID.bind(crypto);
		crypto.randomUUID = () => {
			createdIds++;
			return original();
		};
		nodes[0].updateVersion();
		crypto.randomUUID = original;
		return createdIds;
	});
	// A chain of 32. The walk updates each node once. Ancestors of the
	// chain root are not part of the chain.
	expect(created).toBe(32);
});

test("SS-10382 a leaf update changes the leaf and its ancestors once", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(() => {
		const SDV = (window as any).SDV;
		// 1 root, 8 branches, 8 leaves per branch, below the scene root.
		const root = new SDV.TreeNode("versionRoot");
		SDV.sceneTree.root.addChild(root);
		const nodes: any[] = [SDV.sceneTree.root, root];
		const leaves: any[] = [];
		for (let i = 0; i < 8; i++) {
			const branch = new SDV.TreeNode(`b${i}`, root);
			nodes.push(branch);
			for (let j = 0; j < 8; j++) {
				const leaf = new SDV.TreeNode(`b${i}l${j}`, branch);
				nodes.push(leaf);
				leaves.push(leaf);
			}
		}
		const calls = new Map<any, number>();
		for (const node of nodes) {
			calls.set(node, 0);
			node.updateCallback = () => calls.set(node, calls.get(node)! + 1);
		}
		const measure = (update: () => void) => {
			const before = new Map(nodes.map((node) => [node, node.version]));
			for (const node of nodes) calls.set(node, 0);
			let createdIds = 0;
			const original = crypto.randomUUID.bind(crypto);
			crypto.randomUUID = () => {
				createdIds++;
				return original();
			};
			update();
			crypto.randomUUID = original;
			const changed = nodes.filter(
				(node) => node.version !== before.get(node),
			);
			return {
				createdIds,
				changed: changed.map((node) => node.name),
				listenerCalls: nodes.map((node) => calls.get(node) ?? 0),
				changedOnce: changed.every((node) => calls.get(node) === 1),
			};
		};
		const leaf = measure(() => leaves[0].updateVersion());
		const whole = measure(() => root.updateVersion());
		for (const node of nodes) node.updateCallback = null;
		return {
			nodes: nodes.length,
			leaf,
			wholeCreatedIds: whole.createdIds,
			wholeChanged: whole.changed.length,
			wholeChangedOnce: whole.changedOnce,
			sceneRoot: SDV.sceneTree.root.name,
		};
	});
	expect(result.nodes).toBe(74);
	// The leaf, its branch, the test root and the scene root. 70 nodes keep
	// their version.
	expect(result.leaf.createdIds).toBe(4);
	expect(result.leaf.changed.sort()).toEqual(
		["b0", "b0l0", "versionRoot", result.sceneRoot].sort(),
	);
	expect(result.leaf.changedOnce).toBe(true);
	expect(result.leaf.listenerCalls.reduce((a, b) => a + b, 0)).toBe(4);
	// The test root with its 72 descendants and the scene root above it.
	expect(result.wholeCreatedIds).toBe(74);
	expect(result.wholeChanged).toBe(74);
	expect(result.wholeChangedOnce).toBe(true);
});
