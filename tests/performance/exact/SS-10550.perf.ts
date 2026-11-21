import {expect, type Page} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10550: the listeners of `VIEWPORT_UPDATED` (picking, interaction,
 * animations, cameras) keep their data up to date from the nodes a scene
 * update went through, instead of reading the whole tree each time.
 */

/**
 * Tools for the tests, as `window.__tools`.
 *
 * - `bays(count)`: `count` bays below the root. A bay is a chain of three
 *   nodes with a box on the last one.
 * - `triangle(name, z, parent)`: a triangle in the plane z, all at the same
 *   place, so rays through it hit every triangle of the same z.
 * - `reads`: reads of `TreeNode.data` since `resetReads`.
 * - `updates`: the payloads of `VIEWPORT_UPDATED` since the last `reset`.
 */
function installTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;

	const reads = {count: 0};
	let counting = false;
	function countReads() {
		if (counting) return;
		counting = true;
		let proto = Object.getPrototypeOf(SDV.sceneTree.root);
		while (proto && !Object.getOwnPropertyDescriptor(proto, "data"))
			proto = Object.getPrototypeOf(proto);
		const descriptor = Object.getOwnPropertyDescriptor(proto, "data")!;
		Object.defineProperty(proto, "data", {
			configurable: true,
			get() {
				reads.count++;
				return descriptor.get!.call(this);
			},
			set: descriptor.set,
		});
	}

	const updates: any[] = [];
	SDV.addListener(SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, (event: any) =>
		updates.push(event),
	);

	function material() {
		return new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
	}

	function bays(count: number) {
		const mat = material();
		const meshes: any[] = [];
		for (let i = 0; i < count; i++) {
			const bay = new SDV.TreeNode(`bay${i}`);
			const a = new SDV.TreeNode(`bay${i}a`, bay);
			const b = new SDV.TreeNode(`bay${i}b`, a);
			const geometry = perf.boxGeometry([i * 2, 0, 0], [i * 2 + 1, 1, 1]);
			geometry.material = mat;
			b.addData(geometry);
			SDV.sceneTree.root.addChild(bay);
			meshes.push(b);
		}
		return meshes;
	}

	function triangle(name: string, z: number, parent?: any) {
		const positions = new Float32Array([0, 0, z, 1, 0, z, 0, 1, z]);
		const indices = new Uint16Array([0, 1, 2]);
		const geometry = new SDV.GeometryData(
			new SDV.PrimitiveData(
				{
					POSITION: new SDV.AttributeData(
						positions,
						3,
						12,
						0,
						4,
						false,
						positions.length,
					),
				},
				new SDV.AttributeData(
					indices,
					1,
					2,
					0,
					2,
					false,
					indices.length,
				),
			),
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		geometry.material = new SDV.MaterialUnlitData({color: "#00ff00"});
		const node = new SDV.TreeNode(name);
		node.addData(geometry);
		(parent ?? SDV.sceneTree.root).addChild(node);
		return node;
	}

	/** The nodes a ray from above through (0.2, 0.2) hits, near to far. */
	function pick() {
		return perf.viewport
			.raytraceScene([0.2, 0.2, 10], [0, 0, -1])
			.map((hit: any) => hit.node.name);
	}

	/**
	 * Update the viewport after a change of `node` (its parents get a new
	 * version, nothing else), or after a change of the tree itself.
	 */
	function update(node?: any) {
		if (node) node.updateVersion();
		else SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
	}

	(window as any).__tools = {
		reads,
		updates,
		countReads,
		bays,
		triangle,
		pick,
		update,
		material,
	};
}

async function setup(page: Page) {
	await open(page);
	await page.evaluate(installTools);
}

test("SS-10550 the work of an update does not grow with the scene", async ({
	page,
}) => {
	const sizes: Record<number, {reads: number; changed: number}> = {};
	for (const count of [100, 400]) {
		await setup(page);
		sizes[count] = await page.evaluate(async (count) => {
			const perf = (window as any).__perf;
			const tools = (window as any).__tools;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});
			const meshes = tools.bays(count);
			SDV.sceneTree.root.updateVersion();
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.nextFrame();
			// The first update went through the whole tree. Do a pick, so
			// the listeners that read on demand have read the tree once.
			tools.pick();
			tools.countReads();
			tools.updates.length = 0;
			tools.reads.count = 0;

			// Hide the box of the middle bay.
			const node = meshes[Math.floor(count / 2)];
			node.visible = false;
			tools.update(node);
			const update = tools.updates[tools.updates.length - 1];
			return {
				reads: tools.reads.count,
				changed: update.sceneChanges?.nodes.length ?? -1,
			};
		}, count);
	}
	const result = JSON.stringify(sizes);
	// The same number of reads and of changed nodes for 100 and 400 bays,
	// and a small one. A change of one node is not worth reading the tree.
	expect(sizes[400].reads, result).toBe(sizes[100].reads);
	expect(sizes[400].reads, result).toBeLessThanOrEqual(100);
	expect(sizes[100].changed, result).toBeGreaterThan(0);
	expect(sizes[400].changed, result).toBe(sizes[100].changed);
});

test("SS-10550 picking follows a node that is added, hidden, shown, moved and removed", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const a = tools.triangle("A", 0);
		tools.triangle("B", 0);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();

		const steps: Record<string, string[]> = {};
		steps.start = tools.pick();

		// Hidden and shown again: back in tree order.
		a.visible = false;
		tools.update(a);
		steps.hidden = tools.pick();
		a.visible = true;
		tools.update(a);
		steps.shown = tools.pick();

		// Moved behind B: B is nearer.
		a.addTransformation({
			id: "behind",
			matrix: new Float32Array([
				1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -0.5, 1,
			]),
		});
		tools.update(a);
		steps.behind = tools.pick();

		// A node that is added, moved under another node, and removed.
		const c = tools.triangle("C", 0.5);
		tools.update(c);
		steps.added = tools.pick();
		const group = new SDV.TreeNode("group");
		SDV.sceneTree.root.addChild(group);
		tools.update(group);
		group.addChild(c);
		tools.update(c);
		steps.reparented = tools.pick();
		SDV.sceneTree.root.removeChild(group);
		tools.update();
		steps.removed = tools.pick();
		return steps;
	});
	const text = JSON.stringify(result);
	expect(result.start, text).toEqual(["A", "B"]);
	expect(result.hidden, text).toEqual(["B"]);
	expect(result.shown, text).toEqual(["A", "B"]);
	expect(result.behind, text).toEqual(["B", "A"]);
	expect(result.added, text).toEqual(["C", "B", "A"]);
	expect(result.reparented, text).toEqual(["C", "B", "A"]);
	expect(result.removed, text).toEqual(["B", "A"]);
});

test("SS-10550 a node that is moved in the tree is picked in its new tree order", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const a = tools.triangle("A", 0);
		tools.triangle("B", 0);
		const group = new SDV.TreeNode("group");
		SDV.sceneTree.root.addChild(group);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const steps: Record<string, string[]> = {};
		steps.start = tools.pick();
		// A moves below the group, which comes after B. Both are at the
		// same distance, so the tree order decides.
		group.addChild(a);
		tools.update(group);
		steps.moved = tools.pick();
		return steps;
	});
	const text = JSON.stringify(result);
	expect(result.start, text).toEqual(["A", "B"]);
	expect(result.moved, text).toEqual(["B", "A"]);
});

test("SS-10550 a visibility that a transformation-only update applied is not lost", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		await perf.create({shadows: false});
		const a = tools.triangle("A", 0);
		const b = tools.triangle("B", 0);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		tools.pick();
		// The visibility of A is applied by an update of its transformation
		// only: no scene update goes through A. A scene update of B follows.
		a.visible = false;
		perf.viewport.updateNodeTransformation(a);
		b.addTransformation({
			id: "move",
			matrix: new Float32Array([
				1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0.5, 1,
			]),
		});
		tools.update(b);
		return tools.pick();
	});
	expect(result).toEqual(["B"]);
});

test("SS-10550 a visible change without a new version is still honoured by a plain update", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		await perf.create({shadows: false});
		const a = tools.triangle("A", 0);
		tools.triangle("B", 0);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		tools.pick();
		// No updateVersion: the tree is the same version as before. A plain
		// update goes through the whole tree and the listeners read it.
		a.visible = false;
		perf.viewport.update();
		return tools.pick();
	});
	expect(result).toEqual(["B"]);
});

test("SS-10550 animations are found, named and removed with their nodes", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const a = tools.triangle("A", 0);
		const b = tools.triangle("B", 0);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();

		const animation = (name: string, node: any) =>
			new SDV.AnimationData(
				name,
				[
					{
						times: [0, 1],
						node,
						values: [0, 0, 0, 1, 0, 0],
						path: "translation",
						interpolation: "linear",
					},
				],
				0,
				1,
			);
		const keys = () => Object.keys(perf.viewport.animations);
		const steps: Record<string, string[]> = {};
		steps.none = keys();

		const first = animation("move", a);
		a.addData(first);
		tools.update(a);
		steps.one = keys();

		// The same name twice: suffixes in tree order.
		const second = animation("move", b);
		b.addData(second);
		tools.update(b);
		steps.two = keys();
		const bySuffix = Object.fromEntries(
			Object.entries(perf.viewport.animations).map(([key, data]) => [
				key,
				data === first ? "first" : data === second ? "second" : "?",
			]),
		);

		// An unrelated update keeps the same animations.
		const before = perf.viewport.animations;
		const triangle = tools.triangle("C", 0);
		tools.update(triangle);
		steps.unrelated = keys();
		const sameData = Object.keys(before).every(
			(key) => perf.viewport.animations[key] === before[key],
		);

		a.removeData(first);
		tools.update(a);
		steps.removed = keys();
		return {steps, bySuffix, sameData};
	});
	const text = JSON.stringify(result);
	expect(result.steps.none, text).toEqual([]);
	expect(result.steps.one, text).toEqual(["move"]);
	expect(result.steps.two, text).toEqual(["move_0", "move_1"]);
	expect(result.bySuffix, text).toEqual({
		move_0: "first",
		move_1: "second",
	});
	expect(result.steps.unrelated, text).toEqual(["move_0", "move_1"]);
	expect(result.sameData, text).toBe(true);
	expect(result.steps.removed, text).toEqual(["move"]);
});

test("SS-10550 picking works after updates were suspended, and no hit remains for a removed node", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const a = tools.triangle("A", 0);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		tools.pick();

		perf.viewport.suspendSceneUpdates = true;
		const b = tools.triangle("B", 0);
		a.visible = false;
		tools.update(b);
		const during = tools.pick();
		perf.viewport.suspendSceneUpdates = false;
		perf.viewport.update();
		const after = tools.pick();

		SDV.sceneTree.root.removeChild(b);
		SDV.sceneTree.root.removeChild(a);
		tools.update();
		return {during, after, removed: tools.pick()};
	});
	const text = JSON.stringify(result);
	expect(result.after, text).toEqual(["B"]);
	expect(result.removed, text).toEqual([]);
});

/** Hover with `SDVInteractions` on the nodes with interaction data. */
function installHover() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;
	const {InteractionEngine, HoverManager, InteractionData} = (window as any)
		.SDVInteractions;
	const hits: string[] = [];
	const manager = new HoverManager();
	manager.effectMaterial = new SDV.MaterialStandardData({color: "#dddddd"});
	const engine = new InteractionEngine(perf.viewport);
	engine.addInteractionManager(manager);
	SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (event: any) => {
		hits.push(...(event.nodes ?? []).map((node: any) => node.name));
	});
	(window as any).__hover = {
		hits,
		manager,
		InteractionData,
		client: (point: number[]) => {
			const projected = perf.viewport.convert3Dto2D(point).client;
			return {x: projected[0], y: projected[1]};
		},
	};
}

test("SS-10550 interaction data added to an existing node makes it hoverable", async ({
	page,
}) => {
	await setup(page);
	await page.evaluate(() => (window as any).__perf.create({shadows: false}));
	await page.evaluate(installHover);
	const setupResult = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const hover = (window as any).__hover;
		const meshes = tools.bays(5);
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		// The managers read the tree once, now: nothing is interactive.
		void hover.manager.gatheredGroupedNodes;
		const rect = perf.renderer.domElement.getBoundingClientRect();
		const target = meshes[2];
		target.addData(new hover.InteractionData({hover: true}));
		tools.update(target);
		await perf.nextFrame();
		return {
			rect: {x: rect.x, y: rect.y},
			target: hover.client([2 * 2 + 0.5, 0.5, 1]),
			name: target.name,
		};
	});
	await page.mouse.move(setupResult.rect.x + 4, setupResult.rect.y + 4);
	await page.waitForTimeout(250);
	await page.mouse.move(setupResult.target.x, setupResult.target.y);
	await page.waitForTimeout(300);
	const hits = await page.evaluate(() => [...(window as any).__hover.hits]);
	expect(hits, JSON.stringify(setupResult)).toEqual([setupResult.name]);
});

test("SS-10550 the nodes of a group stay in tree order when nodes are added, hidden and removed", async ({
	page,
}) => {
	await setup(page);
	await page.evaluate(() => (window as any).__perf.create({shadows: false}));
	await page.evaluate(installHover);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const hover = (window as any).__hover;
		const SDV = (window as any).SDV;
		const grouped = (name: string) => {
			const node = tools.triangle(name, 0);
			node.addData(new hover.InteractionData({hover: true}, "g"));
			return node;
		};
		const n1 = grouped("n1");
		const n2 = grouped("n2");
		const n3 = grouped("n3");
		tools.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const names = () =>
			(hover.manager.gatheredGroupedNodes.g ?? []).map(
				(node: any) => node.name,
			);
		const steps: Record<string, string[]> = {};
		steps.start = names();

		// Added below the first node: tree order, not the order of adding.
		const n0 = new SDV.TreeNode("n0", n1);
		n0.addData(new hover.InteractionData({hover: true}, "g"));
		tools.update(n0);
		steps.added = names();

		n2.visible = false;
		tools.update(n2);
		steps.hidden = names();

		SDV.sceneTree.root.removeChild(n1);
		tools.update();
		steps.removed = names();
		void n3;
		return steps;
	});
	const text = JSON.stringify(result);
	expect(result.start, text).toEqual(["n1", "n2", "n3"]);
	expect(result.added, text).toEqual(["n1", "n0", "n2", "n3"]);
	expect(result.hidden, text).toEqual(["n1", "n0", "n3"]);
	expect(result.removed, text).toEqual(["n3"]);
});

test("SS-10550 two viewports: a pick in the second one follows a change made through the first", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const first = perf.viewport;
		const canvas = document.createElement("canvas");
		canvas.width = 320;
		canvas.height = 240;
		document.body.appendChild(canvas);
		const second = await SDV.createViewport({
			canvas,
			id: "second",
			visibility: SDV.VISIBILITY_MANUAL ?? SDV.VISIBILITY_MODE.MANUAL,
		});
		const pick = (viewport: any) =>
			viewport
				.raytraceScene([0.2, 0.2, 10], [0, 0, -1])
				.map((hit: any) => hit.node.name);
		const a = tools.triangle("A", 0);
		SDV.sceneTree.root.updateVersion();
		first.update();
		second.update();
		first.show = true;
		second.show = true;
		await perf.nextFrame();
		const steps: Record<string, string[]> = {};
		steps.first = pick(first);
		steps.second = pick(second);

		// Hidden through the first viewport; the second has not updated.
		a.visible = false;
		a.updateVersion();
		first.update();
		steps.hiddenSecond = pick(second);
		second.update();
		steps.hiddenSecondUpdated = pick(second);

		// And shown again, the second viewport updates first.
		a.visible = true;
		a.updateVersion();
		second.update();
		steps.shownSecond = pick(second);
		first.update();
		steps.shownFirst = pick(first);
		return steps;
	});
	const text = JSON.stringify(result);
	expect(result.first, text).toEqual(["A"]);
	expect(result.second, text).toEqual(["A"]);
	expect(result.hiddenSecond, text).toEqual([]);
	expect(result.hiddenSecondUpdated, text).toEqual([]);
	expect(result.shownSecond, text).toEqual(["A"]);
	expect(result.shownFirst, text).toEqual(["A"]);
});

test("SS-10550 a camera is found by its own viewport only", async ({page}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const first = perf.viewport;
		const canvas = document.createElement("canvas");
		canvas.width = 320;
		canvas.height = 240;
		document.body.appendChild(canvas);
		const second = await SDV.createViewport({
			canvas,
			id: "second",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});
		tools.triangle("A", 0);
		tools.update();
		first.show = true;
		second.show = true;
		await perf.nextFrame();
		const before = [
			Object.keys(first.cameras),
			Object.keys(second.cameras),
		];
		first.createPerspectiveCamera("mine");
		const triangle = tools.triangle("B", 0);
		tools.update(triangle);
		second.update();
		return {
			before,
			first: Object.keys(first.cameras),
			second: Object.keys(second.cameras),
		};
	});
	const text = JSON.stringify(result);
	expect(result.first, text).toContain("mine");
	expect(result.second, text).not.toContain("mine");
	expect(result.first.length, text).toBe(result.before[0].length + 1);
	expect(result.second.length, text).toBe(result.before[1].length);
});
