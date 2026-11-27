import {expect} from "@playwright/test";
import {installBranches, open, test} from "./harness";

test("SS-10394 a leaf change does not read unchanged sibling leaves", async ({
	page,
}) => {
	await open(page);
	const reads = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const root = new SDV.TreeNode("perfRoot");
		SDV.sceneTree.root.addChild(root);
		const unchanged = new SDV.TreeNode("unchanged", root);
		const unchangedLeaves = [];
		for (let i = 0; i < 16; i++)
			unchangedLeaves.push(new SDV.TreeNode(`u${i}`, unchanged));
		const changed = new SDV.TreeNode("changed", root);
		const leaf = new SDV.TreeNode("leaf", changed);
		root.updateVersion();
		perf.viewport.update();
		const proto = Object.getPrototypeOf(leaf);
		const descriptor = Object.getOwnPropertyDescriptor(proto, "version")!;
		const seen = new Set<string>();
		Object.defineProperty(proto, "version", {
			configurable: true,
			get() {
				seen.add(this.id);
				return descriptor.get!.call(this);
			},
			set(value: string) {
				descriptor.set!.call(this, value);
			},
		});
		seen.clear();
		leaf.updateVersion();
		seen.clear();
		perf.viewport.update();
		return {
			changedLeaf: seen.has(leaf.id),
			unchangedLeaves: unchangedLeaves.filter((node) => seen.has(node.id))
				.length,
		};
	});
	expect(reads.changedLeaf).toBe(true);
	expect(reads.unchangedLeaves).toBe(0);
});

test("SS-10394 a leaf change updates one branch of 73 nodes", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const leaf = tree.leaves[7][7];

		// nothing changed below the scene root
		SDV.sceneTree.root.updateVersion(false, false);
		perf.viewport.update();
		const rootOnly = tree.updated();

		// one leaf moves by 10
		leaf.addTransformation(tree.shift(10));
		leaf.updateVersion();
		perf.viewport.update();
		const leafChange = tree.updated();

		// a new leaf in another branch
		const added = new SDV.TreeNode("added", tree.branches[0]);
		const geometry = perf.boxGeometry([40, 0, 0], [41, 1, 1]);
		geometry.material = tree.leaves[0][0].data[0].material;
		added.addData(geometry);
		added.updateVersion();
		perf.viewport.update();
		tree.watch(added);
		const addChange = tree.updated();
		const afterAdd = tree.maxX(tree.top);

		// and removed again
		tree.branches[0].removeChild(added);
		tree.branches[0].updateVersion(true, false);
		perf.viewport.update();
		const removeChange = tree.updated();

		return {
			nodes: tree.nodes.length,
			rootOnly,
			leafChange,
			leafWorldX: tree.worldX(leaf),
			siblingWorldX: tree.worldX(tree.leaves[7][6]),
			topMaxX: tree.maxX(tree.top),
			unchangedBranchMaxX: tree.maxX(tree.branches[3]),
			addChange,
			afterAdd,
			removeChange,
			afterRemove: tree.maxX(tree.top),
			sceneMaxX: tree.maxX(SDV.sceneTree.root),
		};
	});
	expect(result.nodes).toBe(73);
	expect(result.rootOnly).toEqual([]);
	// 3 of 73 nodes: the leaf and its two ancestors below the scene root.
	expect(result.leafChange).toEqual(["b7", "b7l7", "top"]);
	expect(result.leafWorldX).toBeCloseTo(10, 4);
	expect(result.siblingWorldX).toBeCloseTo(0, 4);
	// The moved box ends at 15 + 10. Bounds of skipped branches are kept.
	expect(result.topMaxX).toBeCloseTo(25, 4);
	expect(result.unchangedBranchMaxX).toBeCloseTo(7, 4);
	// A new node is converted by its parent; the watched ancestors are
	// updated once each.
	expect(result.addChange).toEqual(["b0", "top"]);
	expect(result.afterAdd).toBeCloseTo(41, 4);
	expect(result.removeChange).toEqual(["b0", "top"]);
	expect(result.afterRemove).toBeCloseTo(25, 4);
	expect(result.sceneMaxX).toBeCloseTo(25, 4);
});

test("SS-10394 a child added below an unchanged node needs only a root version", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const parent = tree.leaves[2][2];
		const inScene = (node: any) =>
			!!node.convertedObject[perf.viewport.id]?.parent;

		// As the drawing tools do: add below a nested node, version the
		// scene root only.
		const added = new SDV.TreeNode("added");
		const geometry = perf.boxGeometry([40, 0, 0], [41, 1, 1]);
		geometry.material = tree.leaves[0][0].data[0].material;
		added.addData(geometry);
		parent.addChild(added);
		SDV.sceneTree.root.updateVersion(false, false);
		perf.viewport.update();
		const addChange = tree.updated();
		const afterAdd = {inScene: inScene(added), maxX: tree.maxX(tree.top)};

		parent.removeChild(added);
		SDV.sceneTree.root.updateVersion(false, false);
		perf.viewport.update();
		const removeChange = tree.updated();
		const afterRemove = {
			inScene: inScene(added),
			maxX: tree.maxX(tree.top),
		};

		// nothing changed since
		SDV.sceneTree.root.updateVersion(false, false);
		perf.viewport.update();
		const unchanged = tree.updated();

		// Two adds before one update: the second one stops at the branch
		// the first one reached.
		const first = new SDV.TreeNode("first");
		first.addData(geometry);
		tree.leaves[5][5].addChild(first);
		const second = new SDV.TreeNode("second");
		second.addData(perf.boxGeometry([0, 0, 0], [1, 1, 50]));
		tree.leaves[5][4].addChild(second);
		SDV.sceneTree.root.updateVersion(false, false);
		perf.viewport.update();
		return {
			addChange,
			afterAdd,
			removeChange,
			afterRemove,
			unchanged,
			twoAdds: tree.updated().sort(),
			twoAddsInScene: inScene(first) && inScene(second),
		};
	});
	// The path down to the changed node is updated, other branches are not.
	expect(result.addChange).toEqual(["b2", "b2l2", "top"]);
	expect(result.afterAdd.inScene).toBe(true);
	expect(result.afterAdd.maxX).toBeCloseTo(41, 4);
	expect(result.removeChange).toEqual(["b2", "b2l2", "top"]);
	expect(result.afterRemove.inScene).toBe(false);
	expect(result.afterRemove.maxX).toBeCloseTo(15, 4);
	expect(result.unchanged).toEqual([]);
	expect(result.twoAdds).toEqual(["b5", "b5l4", "b5l5", "top"]);
	expect(result.twoAddsInScene).toBe(true);
});

test("SS-10394 a moved or hidden ancestor updates its whole branch", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const branch = tree.branches[2];
		const leaf = tree.leaves[2][0];
		const mesh = leaf.data[0].convertedObject[perf.viewport.id];
		const before = tree.worldX(leaf);

		// The branch moves. Its leaves keep their versions.
		branch.addTransformation(tree.shift(100));
		branch.updateVersion(true, false);
		perf.viewport.update();
		const moved = tree.updated();
		const movedX = tree.worldX(leaf);
		const movedMaxX = tree.maxX(tree.top);

		// The branch is hidden. Its leaves keep their versions.
		branch.visible = false;
		branch.updateVersion(true, false);
		perf.viewport.update();
		const hidden = tree.updated();
		const hiddenMaxX = tree.maxX(tree.top);
		const batch = mesh.userData.batchedMesh;
		const drawn = batch
			? batch.getVisibleAt(mesh.userData.batchId)
			: mesh.visible && mesh.parent.parent.visible;

		return {before, moved, movedX, movedMaxX, hidden, hiddenMaxX, drawn};
	});
	const branch = ["b2", ...Array.from({length: 8}, (_, i) => `b2l${i}`)];
	expect(result.moved).toEqual([...branch, "top"].sort());
	expect(result.movedX).toBeCloseTo(result.before + 100, 4);
	expect(result.movedMaxX).toBeCloseTo(105, 4);
	expect(result.hidden).toEqual([...branch, "top"].sort());
	expect(result.hiddenMaxX).toBeCloseTo(15, 4);
	expect(result.drawn).toBe(false);
});

test("SS-10394 a matrix written outside the scene tree is restored", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const branch = tree.branches[4];
		const object = branch.convertedObject[perf.viewport.id];

		// The transformation tools write the matrix while dragging and
		// leave node.transformations unchanged when the drag is cancelled.
		// The node is then updated, its branch has to follow.
		object.matrixAutoUpdate = false;
		object.matrix.makeTranslation(50, 0, 0);
		object.matrixWorldNeedsUpdate = true;
		branch.updateVersion(true, false);
		perf.viewport.update();
		const updated = tree.updated();
		object.updateWorldMatrix(true, false);
		return {updated, x: object.matrixWorld.elements[12]};
	});
	const branch = ["b4", ...Array.from({length: 8}, (_, i) => `b4l${i}`)];
	expect(result.updated).toEqual([...branch, "top"].sort());
	expect(result.x).toBeCloseTo(0, 4);
});

test("SS-10394 an animation updates the bounding boxes of unchanged ancestors", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const branch = tree.branches[2];
		const before = tree.maxX(tree.top);

		// The animation applies transformations only, without a version
		// update, so no scene update follows.
		const data = new SDV.AnimationData(
			"move",
			[
				{
					times: [0, 0.3],
					node: branch,
					values: [0, 0, 0, 100, 0, 0],
					path: "translation",
					interpolation: "linear",
				},
			],
			0,
			0.3,
		);
		data.reset = false;
		branch.data.push(data);
		data.startAnimation();
		perf.viewport.update();
		await new Promise((resolve) => setTimeout(resolve, 900));
		return {
			before,
			branch: tree.maxX(branch),
			top: tree.maxX(tree.top),
			root: tree.maxX(SDV.sceneTree.root),
		};
	});
	expect(result.before).toBeCloseTo(15, 4);
	expect(result.branch).toBeCloseTo(105, 3);
	expect(result.top).toBeCloseTo(105, 3);
	expect(result.root).toBeCloseTo(105, 3);
});

test("SS-10394 renderer type and instancing switches update every node", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const tree = perf.branches();

		perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
		perf.viewport.update();
		const toAttributes = tree.updated().length;

		// In the attribute visualization an update goes only through the
		// changed branch, as in the standard renderer (SS-10564).
		tree.leaves[0][0].updateVersion();
		perf.viewport.update();
		const inAttributes = tree.updated().length;

		perf.viewport.type = SDV.RENDERER_TYPE.STANDARD;
		perf.viewport.update();
		const toStandard = tree.updated().length;

		perf.viewport.gpuInstancing.enabled =
			!perf.viewport.gpuInstancing.enabled;
		perf.viewport.update();
		const instancing = tree.updated().length;

		// An explicit update of a node always updates its whole branch.
		perf.viewport.updateNode(tree.branches[1]);
		const explicit = tree.updated().length;
		perf.viewport.updateNodeTransformation(tree.top);
		const explicitTransformation = tree.updated().length;

		// The transformation-only update left the bounding boxes empty; the
		// next scene update restores them.
		SDV.sceneTree.root.updateVersion(false, false);
		perf.viewport.update();
		const restored = tree.updated().length;

		return {
			toAttributes,
			inAttributes,
			toStandard,
			instancing,
			explicit,
			explicitTransformation,
			restored,
			topMaxX: tree.maxX(tree.top),
		};
	});
	expect(result.toAttributes).toBe(73);
	// The leaf and its two ancestors (73 before SS-10564).
	expect(result.inAttributes).toBe(3);
	expect(result.toStandard).toBe(73);
	expect(result.instancing).toBe(73);
	expect(result.explicit).toBe(9);
	expect(result.explicitTransformation).toBe(73);
	expect(result.restored).toBe(73);
	expect(result.topMaxX).toBeCloseTo(15, 4);
});
