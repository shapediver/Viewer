import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10492: the attribute visualization updates all items with one reconcile
 * of the material batches (`viewport.updateNodes`), not one per item.
 *
 * `rebuild()` of the batch manager is not reachable from the page. It reads
 * `root.parent` of the batch root once per call, outside of rendering, so
 * the tests count those reads. Test 1 calibrates that.
 * Counts and colours only. Software-safe, shadows are off.
 */

/** Runs in the page. Adds `window.__s`. */
function installTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;
	const SDVAV = (window as any).SDVAttributeVisualization;
	let calls = 0;
	let renderDepth = 0;
	let counting = false;

	/** Call once a scene update has run: the batch root exists then. */
	function countRebuilds() {
		const root =
			perf.viewport.threeJsCoreObjects.scene.getObjectByName(
				"materialBatchRoot",
			);
		if (!root) throw new Error("There is no batch root yet");
		let parent = root.parent;
		Object.defineProperty(root, "parent", {
			configurable: true,
			get() {
				if (counting && renderDepth === 0) calls++;
				return parent;
			},
			set(value) {
				parent = value;
			},
		});
		const render = perf.renderer.render;
		perf.renderer.render = function (...args: any[]) {
			renderDepth++;
			try {
				return render.apply(this, args);
			} finally {
				renderDepth--;
			}
		};
	}

	/** Reconciles during `action`, which may wait. */
	async function rebuilds(action: () => unknown) {
		calls = 0;
		counting = true;
		try {
			// Wait only for an action that waits: a microtask checkpoint would
			// also run what the action scheduled.
			const result = action() as {then?: unknown} | undefined;
			if (result && typeof result.then === "function") await result;
		} finally {
			counting = false;
		}
		return calls;
	}

	/** 24 boxes with one material and two sdTF attributes each. */
	function boxes() {
		const material = new SDV.MaterialStandardData({
			color: "#8899aa",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const nodes: any[] = [];
		for (let i = 0; i < 24; i++) {
			const geometry = perf.boxGeometry(
				[(i % 6) * 1.2, Math.floor(i / 6) * 1.2, 0],
				[(i % 6) * 1.2 + 0.8, Math.floor(i / 6) * 1.2 + 0.8, 0.8],
			);
			geometry.material = material;
			const node = new SDV.TreeNode(`box${i}`);
			node.addData(geometry);
			node.addData(
				new SDV.SDTFItemData("string", `item${i}`, {
					zone: {typeHint: "string", value: `zone${i % 3}`},
					load: {typeHint: "double", value: i},
				}),
			);
			SDV.sceneTree.root.addChild(node);
			nodes.push(node);
		}
		SDV.sceneTree.root.updateVersion();
		return nodes;
	}

	function attribute(key: string) {
		return [
			{
				key,
				type:
					key === "load"
						? SDV.SDTF_TYPEHINT.DOUBLE
						: SDV.SDTF_TYPEHINT.STRING,
				visualization: SDVAV.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED,
			},
		];
	}

	/** Colour of every item as drawn: from its batch, or from its mesh. */
	function colors(nodes: any[]) {
		return nodes.map((node) => {
			const mesh = node.data[0].convertedObject[perf.viewport.id];
			const batch = mesh.userData.batchedMesh;
			if (batch && mesh.userData.batchId !== undefined) {
				const color = batch.material.color.clone();
				batch.getColorAt(mesh.userData.batchId, color);
				return color.getHexString();
			}
			return mesh.material.color.getHexString();
		});
	}

	function canvasCalls() {
		const passes = perf.renders.filter((item: any) => item.target === null);
		return passes[passes.length - 1]?.calls ?? null;
	}

	(window as any).__s = {
		countRebuilds,
		rebuilds,
		boxes,
		attribute,
		colors,
		canvasCalls,
		SDVAV,
	};
}

async function scene(page: any) {
	await open(page);
	await page.evaluate(installTools);
}

test("SS-10492 one updateNode and one updateNodes are one reconcile each", async ({
	page,
}) => {
	await scene(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const s = (window as any).__s;
		await perf.create({shadows: false});
		const nodes = s.boxes();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		s.countRebuilds();
		const one = await s.rebuilds(() => perf.viewport.updateNode(nodes[0]));
		const all = await s.rebuilds(() => perf.viewport.updateNodes(nodes));
		const none = await s.rebuilds(() => perf.viewport.updateNodes([]));
		nodes[1].updateVersion();
		const sceneUpdate = await s.rebuilds(() => perf.viewport.update());
		return {one, all, none, sceneUpdate};
	});

	expect(result.one).toBe(1);
	expect(result.all).toBe(1);
	expect(result.none).toBe(0);
	expect(result.sceneUpdate).toBe(1);
});

test("SS-10492 updateNodes gives the same picture as updateNode per item", async ({
	page,
}) => {
	await scene(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const s = (window as any).__s;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const nodes = s.boxes();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
		await perf.nextFrame();
		let palette = 0;
		perf.viewport.visualizeAttributes = (_overview: any, item: any) => {
			const index = Number(item.value.replace("item", ""));
			const channel = (index * 10 + palette * 90) % 256;
			const hex = (value: number) => value.toString(16).padStart(2, "0");
			return {
				matrix: new Float32Array([
					1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
				]),
				material: new SDV.MaterialStandardData({
					color: `#${hex(channel)}${hex(255 - channel)}28`,
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			};
		};
		const snapshot = async () => {
			perf.renders.length = 0;
			perf.viewport.render();
			await perf.nextFrame();
			return {colors: s.colors(nodes), calls: s.canvasCalls()};
		};
		// Palette 1 per item, as the engine did before.
		palette = 1;
		for (const node of nodes) perf.viewport.updateNode(node);
		const perItem = await snapshot();
		// Palette 2, then palette 1 again, each in one update.
		palette = 2;
		perf.viewport.updateNodes(nodes);
		const other = await snapshot();
		palette = 1;
		perf.viewport.updateNodes(nodes);
		const together = await snapshot();
		return {perItem, other, together};
	});

	expect(result.other.colors).not.toEqual(result.perItem.colors);
	expect(result.together.colors).toEqual(result.perItem.colors);
	expect(result.together.calls).toBe(result.perItem.calls);
});

test("SS-10492 entering reconciles twice and the engine alone none", async ({
	page,
}) => {
	await scene(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const s = (window as any).__s;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		s.boxes();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		s.countRebuilds();
		let engine: any;
		const typeSet = await s.rebuilds(() => {
			perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
		});
		// The constructor must not update the items synchronously.
		const constructed = await s.rebuilds(() => {
			engine = new s.SDVAV.AttributeVisualizationEngine(perf.viewport);
		});
		// updateAttributes and the microtask: one reconcile for all items.
		const items = await s.rebuilds(async () => {
			engine.updateAttributes(s.attribute("load"));
			await Promise.resolve();
			await Promise.resolve();
		});
		return {typeSet, constructed, items};
	});

	expect(result.typeSet).toBe(1);
	expect(result.constructed).toBe(0);
	// Entering is two: the conversion of the type switch and the items.
	expect(result.typeSet + result.items).toBe(2);
});

test("SS-10492 a switch between attributes reconciles once", async ({page}) => {
	await scene(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const s = (window as any).__s;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		s.boxes();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
		const engine = new s.SDVAV.AttributeVisualizationEngine(perf.viewport);
		engine.updateAttributes(s.attribute("zone"));
		await Promise.resolve();
		await Promise.resolve();
		await perf.nextFrame();
		s.countRebuilds();
		return s.rebuilds(async () => {
			engine.updateAttributes(s.attribute("load"));
			await Promise.resolve();
			await Promise.resolve();
		});
	});

	expect(result).toBe(1);
});

test("SS-10492 a throwing item still reconciles once and restores the scope", async ({
	page,
}) => {
	await scene(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const s = (window as any).__s;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const nodes = s.boxes();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
		await perf.nextFrame();
		let throwAt = "";
		perf.viewport.visualizeAttributes = (_overview: any, item: any) => {
			if (item.value === throwAt) throw new Error("item failed");
			return {
				matrix: new Float32Array([
					1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
				]),
				material: new SDV.MaterialStandardData({
					color: "#cc5533",
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			};
		};
		s.countRebuilds();
		throwAt = "item3";
		let message = "";
		const failed = await s.rebuilds(() => {
			try {
				perf.viewport.updateNodes(nodes);
			} catch (error) {
				message = (error as Error).message;
			}
		});
		throwAt = "";
		const later = await s.rebuilds(() =>
			perf.viewport.updateNode(nodes[0]),
		);
		return {message, failed, later};
	});

	expect(result.message).toBe("item failed");
	expect(result.failed).toBe(1);
	// The scope is closed again: a single update reconciles on its own.
	expect(result.later).toBe(1);
});

test("SS-10492 a node without a converted object and a new root version reconcile once", async ({
	page,
}) => {
	await scene(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const s = (window as any).__s;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const nodes = s.boxes();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		s.countRebuilds();
		// Not part of the tree: no converted object, no ancestor with one. The
		// update falls back to a scene update of the whole tree, which has
		// something to do now.
		const detached = new SDV.TreeNode("detached");
		SDV.sceneTree.root.updateVersion();
		return s.rebuilds(() =>
			perf.viewport.updateNodes([nodes[0], detached]),
		);
	});

	expect(result).toBe(1);
});
