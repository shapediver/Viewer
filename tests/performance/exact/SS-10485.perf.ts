import {expect, type Page} from "@playwright/test";
import {SETTLE_MS} from "../budgets/harness";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {openViewer} from "../fixtures/probe";
import {installBranches, open, test} from "./harness";

/**
 * SS-10485: the matrix walk of every render pass leaves out the branches that
 * did not change. Every test but the first one is a regression test of what
 * the walk must still do. Its oracle is the world matrix that is computed
 * from the local matrices of the whole chain, from the scene down (`truth`),
 * compared with `matrixWorld` after the frame that follows the change. A
 * branch that the walk wrongly left out is stale and differs from it.
 *
 * Counts and matrices only, software-safe: shadows are off.
 */

/** Runs in the page. Adds `window.__tools`. */
function installTools() {
	const perf = (window as any).__perf;

	/** The world matrix of an object from its local matrices, from scratch. */
	function truth(object: any): number[] {
		const chain: any[] = [];
		for (let o = object; o; o = o.parent) chain.unshift(o);
		const result = object.matrixWorld.clone().identity();
		for (const o of chain) {
			const local = o.matrixAutoUpdate
				? o.matrix.clone().compose(o.position, o.quaternion, o.scale)
				: o.matrix;
			result.multiply(local);
		}
		return result.elements;
	}

	/** The largest difference between `matrixWorld` and `truth`. */
	function error(object: any): number {
		const expected = truth(object);
		return Math.max(
			...object.matrixWorld.elements.map((value: number, i: number) =>
				Math.abs(value - expected[i]),
			),
		);
	}

	const x = (object: any) => object.matrixWorld.elements[12];

	const canvasDraws = () =>
		perf.renders.filter((item: any) => item.target === null).length;

	/**
	 * Draws until a frame follows the last change. `render()` only requests
	 * the frame. The canvas draws of the first viewport are counted, for
	 * another viewport a few animation frames are enough.
	 */
	async function draw(viewport = perf.viewport) {
		const tracked = viewport === perf.viewport;
		const before = canvasDraws();
		for (let i = 0; i < 300; i++) {
			viewport.render();
			await new Promise((resolve) => requestAnimationFrame(resolve));
			if (tracked ? canvasDraws() > before : i >= 3) return;
		}
		throw new Error("No frame was drawn.");
	}

	/**
	 * A fixed object below the converted object of every leaf. The batches
	 * of the viewer bring their own meshes up to date (SS-10477), so a mesh
	 * says little about the walk: the world matrix of a probe only comes
	 * from the walk.
	 */
	function addProbes(tree: any, viewport: any) {
		const Object3D = object3D();
		return tree.leaves.map((row: any[]) =>
			row.map((leaf) => {
				const probe = new Object3D();
				probe.matrixAutoUpdate = false;
				objectOf(leaf, viewport).add(probe);
				return probe;
			}),
		);
	}

	/** Sets up the viewport and the 8 x 8 boxes tree of `installBranches`. */
	async function setup(options: any = {shadows: false}) {
		await perf.create(options);
		const tree = perf.branches();
		perf.viewport.show = true;
		await perf.nextFrame();
		await perf.nextFrame();
		perf.tree = tree;
		perf.probes = addProbes(tree, perf.viewport);
		await draw();
		return tree;
	}

	const objectOf = (node: any, viewport = perf.viewport) =>
		node.convertedObject[viewport.id];

	/** The Object3D class of three.js, found from the scene. */
	function object3D() {
		const scene = perf.viewport.threeJsCoreObjects.scene;
		return Object.getPrototypeOf(Object.getPrototypeOf(scene)).constructor;
	}

	perf.tools = {
		truth,
		error,
		x,
		draw,
		setup,
		objectOf,
		object3D,
		addProbes,
	};
}

async function prepare(page: Page) {
	await open(page);
	await page.evaluate(installBranches);
	await page.evaluate(installTools);
}

/** Camera frame counts of the AEC fixture with `floors` floors. */
async function cameraFrameWalks(page: Page, floors: number) {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page, "/index.html", {counters: true});
	await page.evaluate(
		([v, options]) => (window as any).__probe.create(v, options),
		[
			{id: "noShadows", shadows: false, ssao: false},
			{...AEC_DEFAULT, floors},
		] as const,
	);
	await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
	await page.clock.runFor(SETTLE_MS);
	await page.waitForTimeout(1500);
	await page.clock.runFor(SETTLE_MS);
	await page.evaluate(() => (window as any).__probe.reset());
	await page.mouse.move(600, 360);
	await page.mouse.down();
	for (let step = 1; step <= 4; step++) {
		await page.mouse.move(600 + step * 20, 360 + step * 10);
		await page.clock.runFor(32);
	}
	await page.mouse.up();
	await page.clock.runFor(SETTLE_MS);
	return page.evaluate(() => {
		const probe = (window as any).__probe;
		const frames = probe.frames();
		const walks = probe.readCounters().matrixWorld;
		// The children of these two roots are not part of the converted tree
		// and are walked as before: one object per batch (a larger fixture
		// needs more batches) and per instanced mesh.
		const children = (name: string) =>
			probe.scene.getObjectByName(name)?.children.length ?? 0;
		return {
			frames: frames.length,
			calls: walks.byFrame[frames[0].frame] ?? 0,
			objects: probe.stats().meshes,
			outside: children("materialBatchRoot") + children("instancedRoot"),
		};
	});
}

test("SS-10485 1: the walk of a static scene does not depend on its size", async ({
	page,
}) => {
	const one = await cameraFrameWalks(page, 1);
	const two = await cameraFrameWalks(page, 2);
	expect(one.frames).toBeGreaterThan(1);
	expect(two.objects, "the second fixture has more objects").toBeGreaterThan(
		one.objects,
	);
	// A small fixed number. Today every object of the scene is walked: about
	// 800 and 1,600 here.
	expect(one.calls).toBeLessThan(100);
	// The walk of the converted tree is the same for both sizes.
	expect(two.calls - two.outside).toBe(one.calls - one.outside);
});

test("SS-10485 2: an orbit moves the camera", async ({page}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		await tools.setup();
		const camera = perf.viewport.threeJsCoreObjects.camera;
		const positions: number[][] = [];
		for (const position of [
			[12, -9, 7],
			[-8, -11, 6],
			[3, 14, 9],
		]) {
			await perf.viewport.camera.set(position, [8, 8, 0], {duration: 0});
			await tools.draw();
			const e = camera.matrixWorld.elements;
			positions.push([e[12], e[13], e[14], tools.error(camera)]);
		}
		return positions;
	});
	for (const [i, expected] of [
		[12, -9, 7],
		[-8, -11, 6],
		[3, 14, 9],
	].entries()) {
		expect(result[i][0]).toBeCloseTo(expected[0], 3);
		expect(result[i][1]).toBeCloseTo(expected[1], 3);
		expect(result[i][2]).toBeCloseTo(expected[2], 3);
		expect(result[i][3]).toBeLessThan(1e-4);
	}
});

test("SS-10485 3: a transformation tool drag moves the object and its children in the same frame", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		const tree = await tools.setup();
		const id = perf.viewport.id;
		// What TransformationToolsManager.updateObjects writes while dragging.
		const drag = (object: any, dx: number) => {
			object.matrixAutoUpdate = false;
			object.matrix.makeTranslation(dx, 0, 0);
			object.matrixWorldNeedsUpdate = true;
		};
		const branch = tools.objectOf(tree.branches[2]);
		drag(branch, 40);
		await tools.draw();
		const leaf = tools.objectOf(tree.leaves[2][3]);
		const mesh = leaf.children[0];
		const probe = perf.probes[2][3];
		const first = {
			branch: tools.x(branch),
			leaf: tools.x(leaf),
			mesh: tools.x(mesh),
			probe: tools.x(probe),
			errors: [branch, leaf, mesh, probe].map(tools.error),
		};
		// A nested node, the branches above it were not touched.
		const nested = tools.objectOf(tree.leaves[5][1]);
		drag(nested, 7);
		await tools.draw();
		const nestedMesh = nested.children[0];
		const nestedProbe = perf.probes[5][1];
		const second = {
			nested: tools.x(nested),
			mesh: tools.x(nestedMesh),
			probe: tools.x(nestedProbe),
			errors: [nested, nestedMesh, nestedProbe].map(tools.error),
			unmoved: tools.x(tools.objectOf(tree.leaves[1][2])),
			previous: tools.x(branch),
		};
		void id;
		return {first, second};
	});
	expect(result.first.branch).toBeCloseTo(40, 4);
	expect(result.first.leaf).toBeCloseTo(40, 4);
	expect(result.first.mesh).toBeCloseTo(40, 4);
	expect(result.first.probe).toBeCloseTo(40, 4);
	expect(Math.max(...result.first.errors)).toBeLessThan(1e-4);
	expect(result.second.nested).toBeCloseTo(7, 4);
	expect(result.second.mesh).toBeCloseTo(7, 4);
	expect(result.second.probe).toBeCloseTo(7, 4);
	expect(Math.max(...result.second.errors)).toBeLessThan(1e-4);
	expect(result.second.unmoved).toBeCloseTo(0, 4);
	expect(result.second.previous).toBeCloseTo(40, 4);
});

test("SS-10485 4: an animation moves the node", async ({page}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const tools = perf.tools;
		const tree = await tools.setup();
		const branch = tree.branches[6];
		const data = new SDV.AnimationData(
			"move",
			[
				{
					times: [0, 0.3],
					node: branch,
					values: [0, 0, 0, 25, 0, 0],
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
		await tools.draw();
		const object = tools.objectOf(branch);
		const mesh = tools.objectOf(tree.leaves[6][2]).children[0];
		const probe = perf.probes[6][2];
		return {
			branch: tools.x(object),
			mesh: tools.x(mesh),
			probe: tools.x(probe),
			errors: [object, mesh, probe].map(tools.error),
		};
	});
	expect(result.branch).toBeCloseTo(25, 3);
	expect(result.mesh).toBeCloseTo(25, 3);
	expect(result.probe).toBeCloseTo(25, 3);
	expect(Math.max(...result.errors)).toBeLessThan(1e-4);
});

test("SS-10485 5: a turntable drag rotates the scene nodes", async ({page}) => {
	await prepare(page);
	await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		const tree = await tools.setup();
		// The turntable rotates the nodes of the session below the root.
		Object.defineProperty(tree.top, "sessionNode", {value: true});
		perf.viewport.camera.enableTurntableControls = true;
		await perf.nextFrame();
	});
	const canvas = await page.locator("#canvas").boundingBox();
	const cx = canvas!.x + canvas!.width / 2;
	const cy = canvas!.y + canvas!.height / 2;
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	for (let step = 1; step <= 6; step++) {
		await page.mouse.move(cx + step * 25, cy);
		await page.evaluate(() => (window as any).__perf.nextFrame());
	}
	await page.mouse.up();
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		await tools.draw();
		const tree = perf.tree;
		const top = tools.objectOf(tree.top);
		const mesh = tools.objectOf(tree.leaves[3][2]).children[0];
		const probe = perf.probes[3][2];
		return {
			// 1 while the node is not rotated
			cos: top.matrixWorld.elements[0],
			probeCos: probe.matrixWorld.elements[0],
			errors: [top, mesh, probe].map(tools.error),
		};
	});
	expect(result.cos).toBeLessThan(0.99);
	expect(result.probeCos).toBeCloseTo(result.cos, 6);
	expect(Math.max(...result.errors)).toBeLessThan(1e-4);
});

test("SS-10485 6: a light moved by a settings change moves", async ({page}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		await tools.setup();
		const lights =
			perf.viewport.lightScene ?? perf.viewport.createLightScene();
		const light = lights.addPointLight({position: [0, 0, 5]});
		perf.viewport.update();
		await tools.draw();
		// The light of a changed version is a new object.
		const find = () => {
			let found: any;
			perf.viewport.threeJsCoreObjects.scene.traverse((o: any) => {
				if (o.isPointLight) found = o;
			});
			return found;
		};
		let three = find();
		const before = [
			three.matrixWorld.elements[12],
			three.matrixWorld.elements[14],
		];
		light.position = [30, 0, 9];
		(window as any).SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await tools.draw();
		three = find();
		return {
			found: !!three,
			before,
			after: [
				three.matrixWorld.elements[12],
				three.matrixWorld.elements[14],
			],
			error: tools.error(three),
		};
	});
	expect(result.found).toBe(true);
	expect(result.before).toEqual([0, 5]);
	expect(result.after[0]).toBeCloseTo(30, 4);
	expect(result.after[1]).toBeCloseTo(9, 4);
	expect(result.error).toBeLessThan(1e-4);
});

test("SS-10485 7: three.js objects that are moved by position move in the next frame", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const tools = perf.tools;
		const tree = await tools.setup();
		const Object3D = tools.object3D();

		// A ThreejsData object with a child, below a node of the tree.
		const object = new Object3D();
		const child = new Object3D();
		child.position.set(0, 1, 0);
		object.add(child);
		const node = new SDV.TreeNode("three");
		node.addData(new SDV.ThreejsData(object));
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await tools.draw();
		object.position.set(5, 6, 7);
		await tools.draw();
		const threejsData = {
			x: tools.x(object),
			y: object.matrixWorld.elements[13],
			childY: child.matrixWorld.elements[13],
			errors: [object, child].map(tools.error),
		};

		// An object added to the scene of the viewport.
		const scene = perf.viewport.threeJsCoreObjects.scene;
		const added = new Object3D();
		scene.add(added);
		await tools.draw();
		added.position.set(-4, 0, 0);
		await tools.draw();
		const addedToScene = {x: tools.x(added), error: tools.error(added)};

		// The scene itself, and with it every node.
		const leaf = tools.objectOf(tree.leaves[3][3]);
		const leafBefore = tools.x(leaf);
		scene.position.set(11, 0, 0);
		await tools.draw();
		const movedScene = {
			leaf: tools.x(leaf),
			mesh: tools.x(leaf.children[0]),
			added: tools.x(added),
			errors: [leaf, leaf.children[0]].map(tools.error),
		};
		scene.position.set(0, 0, 0);
		await tools.draw();
		return {
			threejsData,
			addedToScene,
			leafBefore,
			movedScene,
			back: tools.x(leaf),
		};
	});
	expect(result.threejsData.x).toBeCloseTo(5, 4);
	expect(result.threejsData.y).toBeCloseTo(6, 4);
	expect(result.threejsData.childY).toBeCloseTo(7, 4);
	expect(Math.max(...result.threejsData.errors)).toBeLessThan(1e-4);
	expect(result.addedToScene.x).toBeCloseTo(-4, 4);
	expect(result.addedToScene.error).toBeLessThan(1e-4);
	expect(result.movedScene.leaf).toBeCloseTo(result.leafBefore + 11, 4);
	expect(result.movedScene.mesh).toBeCloseTo(result.leafBefore + 11, 4);
	expect(result.movedScene.added).toBeCloseTo(-4 + 11, 4);
	expect(Math.max(...result.movedScene.errors)).toBeLessThan(1e-4);
	expect(result.back).toBeCloseTo(result.leafBefore, 4);
});

test("SS-10485 8: the gumball keeps its screen size while zooming", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		const tree = await tools.setup();
		const SDVTT = (window as any).SDVTransformationTools;
		const node = tree.leaves[4][4];
		const gumball = new SDVTT.GumballTransform(perf.viewport, [node], {});
		await perf.viewport.camera.set([12, -9, 7], [8, 8, 0], {duration: 0});
		await tools.draw();
		let controls: any;
		perf.viewport.threeJsCoreObjects.scene.traverse((o: any) => {
			if (o.gizmo && o.worldPosition && !controls) controls = o;
		});
		const handle = () =>
			controls.gizmo.gizmo.translate.children.find(
				(c: any) => c.scale.x > 1e-6,
			);
		const sample = () => ({
			distance: controls.worldPosition.distanceTo(
				controls.cameraPosition,
			),
			scale: handle().scale.x,
		});
		const near = sample();
		await perf.viewport.camera.set([30, -22, 17], [8, 8, 0], {
			duration: 0,
		});
		await tools.draw();
		const far = sample();
		const result = {
			near,
			far,
			position: controls.worldPosition.x,
			object: [tools.x(controls.object), tools.error(controls.object)],
		};
		gumball.close();
		return result;
	});
	expect(result.far.distance).toBeGreaterThan(result.near.distance * 1.5);
	// handle size = distance x constant: the same size on screen
	expect(result.far.scale / result.far.distance).toBeCloseTo(
		result.near.scale / result.near.distance,
		5,
	);
	expect(result.position).toBeCloseTo(result.object[0], 4);
	expect(result.object[1]).toBeLessThan(1e-4);
});

test("SS-10485 9: a node change moves the node in both viewports", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const tools = perf.tools;
		const tree = await tools.setup();
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
		second.shadows = false;
		second.update();
		second.show = true;
		for (let i = 0; i < 3; i++)
			await new Promise((resolve) => requestAnimationFrame(resolve));
		const probes = [perf.probes, tools.addProbes(tree, second)];
		await tools.draw(second);
		const branch = tree.branches[1];
		const read = (viewport: any, index: number) => {
			const object = tools.objectOf(branch, viewport);
			const mesh = tools.objectOf(tree.leaves[1][1], viewport)
				.children[0];
			const probe = probes[index][1][1];
			return {
				x: tools.x(object),
				mesh: tools.x(mesh),
				probe: tools.x(probe),
				errors: [object, mesh, probe].map(tools.error),
			};
		};
		const before = [read(first, 0), read(second, 1)];
		// A full update would also drop the probes, which are not part of
		// the tree.
		branch.addTransformation(tree.shift(60));
		first.updateNodeTransformation(branch);
		second.updateNodeTransformation(branch);
		await tools.draw(first);
		await tools.draw(second);
		return {before, after: [read(first, 0), read(second, 1)]};
	});
	for (const state of result.before) expect(state.x).toBeCloseTo(0, 4);
	for (const state of result.after) {
		expect(state.x).toBeCloseTo(60, 4);
		expect(state.mesh).toBeCloseTo(60, 4);
		expect(state.probe).toBeCloseTo(60, 4);
		expect(Math.max(...state.errors)).toBeLessThan(1e-4);
	}
});

test("SS-10485 10: a raycast right after update() hits the moved object", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const tools = perf.tools;
		const tree = await tools.setup();
		const leaf = tree.leaves[2][2];
		// The box of this leaf spans x 4..5, y 4..5, z 0..1.
		const down = (x: number, y: number) =>
			perf.viewport
				.raytraceScene([x, y, 10], [0, 0, -1])
				.map((hit: any) => hit.node.name);
		const before = {old: down(4.5, 4.5), moved: down(104.5, 4.5)};
		const branch = tree.branches[2];
		branch.addTransformation(tree.shift(100));
		branch.updateVersion(true, false);
		perf.viewport.update();
		// no frame in between
		const after = {old: down(4.5, 4.5), moved: down(104.5, 4.5)};
		return {name: leaf.name, before, after};
	});
	expect(result.before.old).toContain(result.name);
	expect(result.before.moved).toEqual([]);
	expect(result.after.moved).toContain(result.name);
	expect(result.after.old).not.toContain(result.name);
});

test("SS-10485 11: new children and re-parented nodes render at their place", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const tools = perf.tools;
		const tree = await tools.setup();
		const material = new SDV.MaterialStandardData({color: "#cc6688"});

		// A new leaf below an existing branch that did not change.
		const branch = tree.branches[3];
		branch.addTransformation(tree.shift(30));
		branch.updateVersion(true, false);
		perf.viewport.update();
		await tools.draw();
		const geometry = perf.boxGeometry([0, 0, 2], [1, 1, 3]);
		geometry.material = material;
		const fresh = new SDV.TreeNode("fresh", branch);
		fresh.addData(geometry);
		branch.updateVersion();
		perf.viewport.update();
		await tools.draw();
		const freshObject = tools.objectOf(fresh);
		const created = {
			x: tools.x(freshObject),
			mesh: tools.x(freshObject.children[0]),
			errors: [freshObject, freshObject.children[0]].map(tools.error),
		};

		// A node moved below another parent.
		const target = tree.branches[6];
		target.addTransformation(tree.shift(100));
		target.updateVersion(true, false);
		perf.viewport.update();
		await tools.draw();
		const moved = tree.leaves[4][0];
		target.addChild(moved);
		tree.top.updateVersion();
		perf.viewport.update();
		await tools.draw();
		const movedObject = tools.objectOf(moved);
		const reparented = {
			x: tools.x(movedObject),
			mesh: tools.x(movedObject.children[0]),
			errors: [movedObject, movedObject.children[0]].map(tools.error),
		};

		// Objects added by hand to the converted object of a node that did not
		// change: with an automatic and with a fixed matrix.
		const host = tools.objectOf(tree.leaves[7][7]);
		const Object3D = tools.object3D();
		const auto = new Object3D();
		auto.position.set(9, 0, 0);
		const fixed = new Object3D();
		fixed.matrixAutoUpdate = false;
		fixed.matrix.makeTranslation(0, 9, 0);
		host.add(auto);
		host.add(fixed);
		await tools.draw();
		const byHand = {
			auto: tools.x(auto),
			fixed: fixed.matrixWorld.elements[13],
			host: tools.x(host),
			errors: [auto, fixed].map(tools.error),
		};
		return {created, reparented, byHand};
	});
	expect(result.created.x).toBeCloseTo(30, 4);
	expect(result.created.mesh).toBeCloseTo(30, 4);
	expect(Math.max(...result.created.errors)).toBeLessThan(1e-4);
	expect(result.reparented.x).toBeCloseTo(100, 4);
	expect(result.reparented.mesh).toBeCloseTo(100, 4);
	expect(Math.max(...result.reparented.errors)).toBeLessThan(1e-4);
	expect(result.byHand.auto).toBeCloseTo(result.byHand.host + 9, 4);
	expect(result.byHand.fixed).toBeCloseTo(9, 4);
	expect(Math.max(...result.byHand.errors)).toBeLessThan(1e-4);
});

test("SS-10485 12: objects inside a three.js object keep three.js behaviour", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const tools = perf.tools;
		await tools.setup();
		const Object3D = tools.object3D();
		const object = new Object3D();
		// A fixed matrix: three.js did not recompute it on its own, the
		// force of the scene did.
		object.matrixAutoUpdate = false;
		object.matrix.makeTranslation(2, 0, 0);
		const existing = new Object3D();
		existing.matrixAutoUpdate = false;
		object.add(existing);
		const node = new SDV.TreeNode("three");
		node.addData(new SDV.ThreejsData(object));
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await tools.draw();

		// (a) a child with a fixed matrix, added later, no flag
		const added = new Object3D();
		added.matrixAutoUpdate = false;
		added.matrix.makeTranslation(0, 0, 6);
		object.add(added);
		// (b) a matrix written without a flag
		existing.matrix.makeTranslation(0, 8, 0);
		await tools.draw();
		const e = (o: any) => [...o.matrixWorld.elements].slice(12, 15);
		return {
			added: e(added),
			existing: e(existing),
			errors: [added, existing].map(tools.error),
		};
	});
	expect(result.added[0]).toBeCloseTo(2, 4);
	expect(result.added[2]).toBeCloseTo(6, 4);
	expect(result.existing[0]).toBeCloseTo(2, 4);
	expect(result.existing[1]).toBeCloseTo(8, 4);
	expect(Math.max(...result.errors)).toBeLessThan(1e-4);
});

test("SS-10485 13: a directional light follows the scene bounds without being converted again", async ({
	page,
}) => {
	await prepare(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const tools = perf.tools;
		const tree = await tools.setup();
		const lights =
			perf.viewport.lightScene ?? perf.viewport.createLightScene();
		const api = lights.addDirectionalLight({});
		perf.viewport.update();
		await tools.draw();
		const find = () => {
			let found: any;
			perf.viewport.threeJsCoreObjects.scene.traverse((o: any) => {
				if (o.isDirectionalLight) found = o;
			});
			return found;
		};
		const state = () => {
			const light = find();
			const sphere =
				SDV.sceneTree.root.boundingBoxViewport[perf.viewport.id]
					.boundingSphere;
			const p = (o: any) => [...o.matrixWorld.elements].slice(12, 15);
			return {
				light: p(light),
				target: p(light.target),
				center: [...sphere.center],
				radius: sphere.radius,
				errors: [light, light.target].map(tools.error),
			};
		};
		const before = state();
		// Geometry far away: the bounds change, the light data does not.
		const geometry = perf.boxGeometry([0, 0, 0], [1, 1, 1]);
		geometry.material = new SDV.MaterialStandardData({color: "#cc6688"});
		const far = new SDV.TreeNode("far");
		far.addData(geometry);
		far.addTransformation(tree.shift(400));
		tree.top.addChild(far);
		tree.top.updateVersion();
		perf.viewport.update();
		await tools.draw();
		return {before, after: state(), direction: [...api.direction]};
	});
	const {before, after, direction} = result;
	expect(after.center[0]).toBeGreaterThan(before.center[0] + 50);
	expect(after.radius).toBeGreaterThan(before.radius);
	// the target is at the centre of the bounding sphere
	for (let i = 0; i < 3; i++)
		expect(after.target[i]).toBeCloseTo(after.center[i], 3);
	// the light is at centre + direction * radius * 2.35
	for (let i = 0; i < 3; i++)
		expect(after.light[i]).toBeCloseTo(
			after.center[i] + direction[i] * after.radius * 2.35,
			2,
		);
	expect(Math.max(...after.errors)).toBeLessThan(1e-4);
});
