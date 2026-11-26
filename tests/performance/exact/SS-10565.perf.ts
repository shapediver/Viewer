import {expect, type Page} from "@playwright/test";
import {count, open as openCount, SCENE} from "../bench/count/context";
import {open, test} from "./harness";

/**
 * SS-10565: the scene tree's version counter is the one change clock.
 *
 * - A node records, per kind of change, the clock value of its last change
 *   of that kind, where the edit happens (setters, data). A viewport reports
 *   per node the kinds it had not applied before (`sceneChanges.kinds`).
 * - `viewport.sceneState.revisions` gives per channel the clock value at
 *   which the viewport last applied a change of it; `static` and `reasons`
 *   say whether the scene changes by itself, `SCENE_STATE_CHANGED` fires
 *   once per switch.
 * - A hide, show or move is the edit plus `updateVersion()`: no work that
 *   grows with the scene, the next frame applies it with the same report as
 *   `viewport.update()`.
 *
 * The report tests run on 4 and 64 bays and must give the same result on
 * both. No pixels, no timing: software-renderer safe.
 */

/**
 * Tools for the tests, as `window.__tools`.
 *
 * - `bays(count)`: `count` bays below the root. A bay is a chain of three
 *   nodes with a box on the last one.
 * - `updates`, `states`: payloads of `VIEWPORT_UPDATED` and
 *   `SCENE_STATE_CHANGED` since the last reset.
 * - `kindsOf(update, node)`: the kinds of `node` in a report.
 * - `revisions()`: a copy of the viewport's revisions; `later(a, b)` the
 *   channels that are later in `b` than in `a`.
 */
function installTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;

	const updates: any[] = [];
	const states: any[] = [];
	SDV.addListener(SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, (event: any) =>
		updates.push(event),
	);
	SDV.addListener(SDV.EVENTTYPE.VIEWPORT.SCENE_STATE_CHANGED, (event: any) =>
		states.push(event),
	);

	function bays(count: number) {
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const meshes: any[] = [];
		for (let i = 0; i < count; i++) {
			const bay = new SDV.TreeNode(`bay${i}`);
			const a = new SDV.TreeNode(`bay${i}a`, bay);
			const b = new SDV.TreeNode(`bay${i}b`, a);
			const geometry = perf.boxGeometry([i * 2, 0, 0], [i * 2 + 1, 1, 1]);
			geometry.material = material;
			b.addData(geometry);
			b.addTransformation({id: "place", matrix: shift(0)});
			SDV.sceneTree.root.addChild(bay);
			meshes.push(b);
		}
		return meshes;
	}

	function shift(x: number) {
		return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1];
	}

	function kindsOf(update: any, node: any) {
		const changes = update?.sceneChanges;
		if (!changes) return "no report";
		const index = changes.nodes.indexOf(node);
		return index < 0 ? "not reported" : [...changes.kinds[index]];
	}

	/** The kinds of every reported node except `node`, joined. */
	function othersOf(update: any, node: any) {
		const changes = update?.sceneChanges;
		if (!changes) return "no report";
		const others = new Set<string>();
		changes.nodes.forEach((n: any, i: number) => {
			if (n !== node)
				for (const kind of changes.kinds[i]) others.add(kind);
		});
		return [...others].sort();
	}

	function revisions(viewport = perf.viewport) {
		return {...viewport.sceneState.revisions};
	}

	function later(a: any, b: any) {
		return Object.keys(b)
			.filter((channel) => b[channel] > a[channel])
			.sort();
	}

	function last() {
		return updates[updates.length - 1];
	}

	async function setup(count: number) {
		await perf.create({shadows: false});
		const meshes = bays(count);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		updates.length = 0;
		states.length = 0;
		return meshes;
	}

	(window as any).__tools = {
		updates,
		states,
		bays,
		shift,
		kindsOf,
		othersOf,
		revisions,
		later,
		last,
		setup,
	};
}

async function setup(page: Page) {
	await open(page);
	await page.evaluate(installTools);
}

/** Runs `body` on 4 and on 64 bays; the results must be equal. */
async function onBothSizes<T>(
	page: Page,
	body: (count: number) => Promise<T>,
): Promise<T> {
	const results: T[] = [];
	for (const count of [4, 64]) {
		await setup(page);
		results.push(await page.evaluate(body, count));
	}
	expect(JSON.stringify(results[1]), JSON.stringify(results)).toBe(
		JSON.stringify(results[0]),
	);
	return results[0];
}

test("SS-10565 each edit of one node is reported with exactly its kind", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		const meshes = await tools.setup(count);
		const node = meshes[Math.floor(count / 2)];
		const steps: Record<string, unknown> = {};
		const step = (name: string, target: any, edit: () => void) => {
			const before = tools.revisions();
			edit();
			perf.viewport.update();
			const update = tools.last();
			steps[name] = {
				node: tools.kindsOf(update, target),
				others: tools.othersOf(update, target),
				channels: tools.later(before, tools.revisions()),
			};
		};

		step("geometry", node, () => node.data[0].updateVersion());
		step("visibility", node, () => {
			node.visible = false;
			node.updateVersion();
		});
		step("transformation", node, () => {
			node.transformations = [{id: "place", matrix: tools.shift(0.5)}];
			node.updateVersion();
		});
		step("structure", node, () => {
			node.addChild(new SDV.TreeNode("empty"));
			node.updateVersion();
		});
		// A move applied by a transformation-only update first.
		step("transformation, updateNodeTransformation first", node, () => {
			node.transformations = [{id: "place", matrix: tools.shift(0.25)}];
			perf.viewport.updateNodeTransformation(node);
			node.updateVersion();
		});
		// A visibility change applied after a move that is still waiting.
		step("move, then visibility, updateNodeTransformation", node, () => {
			node.transformations = [{id: "place", matrix: tools.shift(0.75)}];
			perf.viewport.updateNodeTransformation(node);
			node.visible = true;
			perf.viewport.updateNodeTransformation(node);
			node.updateVersion();
		});
		step("updateVersion", node, () => node.updateVersion());
		step("in place", node, () => {
			node.transformations[0].matrix = tools.shift(1);
			node.updateVersion();
		});
		step("removed", node.parent, () => {
			const parent = node.parent;
			parent.removeChild(node);
			parent.updateVersion();
		});
		steps.removedNodeIds = tools
			.last()
			?.sceneChanges?.removedNodeIds.includes(node.id);

		// A camera data item added to the node that holds the cameras.
		const before = tools.revisions();
		const camera = perf.viewport.createPerspectiveCamera("ss10565");
		let cameraNode: any;
		SDV.sceneTree.root.traverse((n: any) => {
			if (n.data.some((d: any) => d.id === camera.id)) cameraNode = n;
		});
		cameraNode.updateVersion();
		perf.viewport.update();
		steps.camera = {
			node: tools.kindsOf(tools.last(), cameraNode),
			others: tools.othersOf(tools.last(), cameraNode),
			channels: tools.later(before, tools.revisions()),
		};
		return steps;
	});
	const only = (kind: string) => ({
		node: [kind],
		others: [],
		channels: [kind],
	});
	expect(result.geometry).toEqual(only("geometry"));
	expect(result.visibility).toEqual(only("visibility"));
	expect(result.transformation).toEqual(only("transformation"));
	expect(result["transformation, updateNodeTransformation first"]).toEqual(
		only("transformation"),
	);
	expect(result["move, then visibility, updateNodeTransformation"]).toEqual({
		node: ["transformation", "visibility"],
		others: [],
		channels: ["transformation", "visibility"],
	});
	expect(result.structure).toEqual(only("structure"));
	// updateVersion() alone: reported, no kind, no channel.
	expect(result.updateVersion).toEqual({node: [], others: [], channels: []});
	// A matrix changed in place is found by the scene update.
	expect(result["in place"]).toEqual(only("transformation"));
	// A removal is a structure change of the parent (decision 5).
	expect(result.removed).toEqual(only("structure"));
	expect(result.removedNodeIds).toBe(true);
	expect(result.camera).toEqual({
		node: ["camera"],
		others: [],
		channels: ["camera"],
	});
});

test("SS-10565 a light change is a light kind, a pass through the light branch is not", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		const meshes = await tools.setup(count);
		const scene = perf.viewport.createLightScene({standard: false});
		const light = scene.addDirectionalLight({intensity: 1});
		perf.viewport.assignLightScene(scene.id);
		perf.viewport.update();
		let lightNode: any;
		SDV.sceneTree.root.traverse((n: any) => {
			if (n.data.some((d: any) => d.id === light.id)) lightNode = n;
		});

		// The light API runs the update itself.
		let before = tools.revisions();
		light.intensity = 2;
		const changed = {
			node: tools.kindsOf(tools.last(), lightNode),
			others: tools.othersOf(tools.last(), lightNode),
			channels: tools.later(before, tools.revisions()),
		};

		// A geometry change elsewhere passes through the light branch.
		before = tools.revisions();
		const node = meshes[0];
		node.data[0].updateVersion();
		perf.viewport.update();
		const passed = {
			light: tools.kindsOf(tools.last(), lightNode),
			channels: tools.later(before, tools.revisions()),
		};
		return {changed, passed};
	});
	expect(result.changed).toEqual({
		node: ["light"],
		others: [],
		channels: ["light"],
	});
	expect(result.passed).toEqual({light: [], channels: ["geometry"]});
});

test("SS-10565 a second viewport reads the in-place move of the first without a second record", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		const meshes = await tools.setup(count);
		const canvas = document.createElement("canvas");
		canvas.style.width = "320px";
		canvas.style.height = "200px";
		document.body.appendChild(canvas);
		const second = await SDV.createViewport({
			canvas,
			id: "perf2",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});
		second.environmentMap = SDV.ENVIRONMENT_MAP_EMPTY.NONE;
		second.update();
		perf.viewport.update();
		tools.updates.length = 0;

		const node = meshes[Math.floor(count / 2)];
		node.transformations[0].matrix = tools.shift(2);
		node.updateVersion();
		perf.viewport.update();
		const first = tools.kindsOf(tools.last(), node);
		const recorded = node.changeSerials.transformation;
		const firstRevisions = tools.revisions();
		const before = tools.revisions(second);
		tools.updates.length = 0;
		second.update();
		const fromSecond = tools.updates.filter(
			(u: any) => u.viewportId === "perf2",
		);
		return {
			first,
			second:
				fromSecond.length === 1
					? tools.kindsOf(fromSecond[0], node)
					: `${fromSecond.length} events`,
			secondChannels: tools.later(before, tools.revisions(second)),
			recordedOnce: node.changeSerials.transformation === recorded,
			firstUnchanged:
				JSON.stringify(tools.revisions()) ===
				JSON.stringify(firstRevisions),
		};
	});
	expect(result).toEqual({
		first: ["transformation"],
		second: ["transformation"],
		secondChannels: ["transformation"],
		recordedOnce: true,
		firstUnchanged: true,
	});
});

test("SS-10565 a hover material raises material at once, without a scene update", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		const meshes = await tools.setup(count);
		const node = meshes[Math.floor(count / 2)];
		const geometry = node.data[0];
		const version = node.version;
		const before = tools.revisions();
		geometry.effectMaterials.push({
			material: new SDV.MaterialStandardData({color: "#ff0000"}),
			token: "hover",
		});
		perf.viewport.updateGeometryData(geometry);
		const atOnce = tools.later(before, tools.revisions());
		const events = tools.updates.length;
		const versionUnchanged = version === node.version;
		// The node carries the material change into its next report.
		node.updateVersion();
		perf.viewport.update();
		return {
			atOnce,
			events,
			versionUnchanged,
			next: tools.kindsOf(tools.last(), node),
		};
	});
	expect(result).toEqual({
		atOnce: ["material"],
		events: 0,
		versionUnchanged: true,
		next: ["material"],
	});
});

test("SS-10565 revisions are application times, not edit times", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		const meshes = await tools.setup(count);
		const node = meshes[Math.floor(count / 2)];
		const frames = async (n: number) => {
			for (let i = 0; i < n; i++)
				await new Promise((resolve) => requestAnimationFrame(resolve));
		};
		const token = perf.viewport.addFlag(
			SDV.FLAG_TYPE.SUSPEND_SCENE_UPDATES,
		);
		await frames(2);
		const before = tools.revisions();
		node.visible = false;
		node.updateVersion();
		perf.viewport.update();
		await frames(3);
		const whileSuspended = tools.later(before, tools.revisions());
		perf.viewport.environmentMapIntensity = 0.5;
		const setting = tools.revisions().environment;
		// The setting is applied after the hide was edited.
		const settingAfterEdit = setting > node.changeSerials.visibility;
		tools.updates.length = 0;
		// Removing the flag applies the waiting change.
		perf.viewport.removeFlag(token);
		await frames(3);
		const update = tools.updates.find((u: any) =>
			u.sceneChanges?.nodes.includes(node),
		);
		return {
			whileSuspended,
			settingAfterEdit,
			hide: tools.kindsOf(update, node),
			appliedAfterSetting: tools.revisions().visibility > setting,
		};
	});
	expect(result).toEqual({
		whileSuspended: [],
		settingAfterEdit: true,
		hide: ["visibility"],
		appliedAfterSetting: true,
	});
});

test("SS-10565 a setting or size change raises only its channel, the same value nothing", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		await tools.setup(count);
		const viewport = perf.viewport;
		const steps: Record<string, unknown> = {};
		// A size is applied by the next animation frame.
		const frames = async (n: number) => {
			for (let i = 0; i < n; i++)
				await new Promise((resolve) => requestAnimationFrame(resolve));
		};
		/** The channels `edit` raises, then those `again` (the same value) raises. */
		const step = async (
			name: string,
			edit: () => void,
			again: () => void = edit,
			wait = 0,
		) => {
			let before = tools.revisions();
			edit();
			await frames(wait);
			const changed = tools.later(before, tools.revisions());
			before = tools.revisions();
			again();
			await frames(wait);
			steps[name] = [changed, tools.later(before, tools.revisions())];
		};
		await step("environmentMapIntensity", () => {
			viewport.environmentMapIntensity = 0.7;
		});
		await step("shadows", () => {
			viewport.shadows = true;
		});
		await step("toneMappingExposure", () => {
			viewport.toneMappingExposure = 1.3;
		});
		await step("groundPlaneVisibility", () => {
			viewport.groundPlaneVisibility = true;
		});
		await step(
			"ssao",
			() =>
				viewport.postProcessing.addEffect({
					type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				}),
			// a post-processing setting set to its value
			() => {
				const hdr = viewport.postProcessing.hdr;
				viewport.postProcessing.hdr = hdr;
			},
		);
		const resize = () => {
			// The canvas fills its parent.
			const parent = document.getElementById("canvas")!.parentElement!;
			parent.style.width = "640px";
			parent.style.height = "360px";
		};
		await step("resize", resize, resize, 5);
		// A smaller drawing buffer: the pixel ratio the canvas is drawn
		// with changes (the public way to change it; the internal pixel
		// ratio override takes the same path).
		await step(
			"maximumRenderingSize",
			() => {
				viewport.maximumRenderingSize = {width: 320, height: 180};
			},
			undefined,
			5,
		);
		return steps;
	});
	expect(result).toEqual({
		environmentMapIntensity: [["environment"], []],
		shadows: [["shadows"], []],
		toneMappingExposure: [["colorManagement"], []],
		groundPlaneVisibility: [["environmentGeometry"], []],
		ssao: [["postProcessing"], []],
		resize: [["size"], []],
		maximumRenderingSize: [["size"], []],
	});
});

test("SS-10565 the scene state switches once per reason", async ({page}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const SDV = (window as any).SDV;
		const meshes = await tools.setup(count);
		const viewport = perf.viewport;
		const frames = async (n: number) => {
			for (let i = 0; i < n; i++)
				await new Promise((resolve) => requestAnimationFrame(resolve));
		};
		const steps: Record<string, unknown> = {};
		const record = async (
			name: string,
			on: () => void,
			off: () => void,
		) => {
			tools.states.length = 0;
			on();
			await frames(3);
			off();
			await frames(3);
			steps[name] = tools.states.map((event: any) => [
				event.sceneState.static,
				[...event.sceneState.reasons],
			]);
		};
		steps.initial = [
			viewport.sceneState.static,
			viewport.sceneState.reasons,
		];
		// Both are flags of the viewport.
		let token = "";
		await record(
			"continuousRendering",
			() =>
				(token = viewport.addFlag(SDV.FLAG_TYPE.CONTINUOUS_RENDERING)),
			() => viewport.removeFlag(token),
		);
		await record(
			"continuousShadowMapUpdate",
			() =>
				(token = viewport.addFlag(
					SDV.FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE,
				)),
			() => viewport.removeFlag(token),
		);
		await record(
			"objectControls",
			() => (viewport.camera.enableObjectControls = true),
			() => (viewport.camera.enableObjectControls = false),
		);
		// Camera movement and a three.js object do not make it dynamic.
		await record(
			"camera",
			() => (viewport.camera.position = [10, 10, 10]),
			() => (viewport.camera.position = [20, 10, 10]),
		);
		const core = viewport.threeJsCoreObjects;
		const Object3D = Object.getPrototypeOf(
			Object.getPrototypeOf(core.scene),
		).constructor;
		await record(
			"threejsData",
			() => {
				const node = new SDV.TreeNode("three");
				node.addData(new SDV.ThreejsData(new Object3D()));
				SDV.sceneTree.root.addChild(node);
				SDV.sceneTree.root.updateVersion();
			},
			() => {},
		);

		// An animation of 0.3 s: dynamic while it runs, static after.
		tools.states.length = 0;
		const data = new SDV.AnimationData(
			"move",
			[
				{
					times: [0, 0.3],
					node: meshes[0],
					values: [0, 0, 0, 1, 0, 0],
					path: "translation",
					interpolation: "linear",
				},
			],
			0,
			0.3,
		);
		data.reset = false;
		meshes[0].data.push(data);
		data.startAnimation();
		viewport.update();
		await new Promise((resolve) => setTimeout(resolve, 900));
		await frames(3);
		steps.animation = tools.states.map((event: any) => [
			event.sceneState.static,
			[...event.sceneState.reasons],
		]);
		return steps;
	});
	const twice = (reason: string) => [
		[false, [reason]],
		[true, []],
	];
	expect(result).toEqual({
		initial: [true, []],
		continuousRendering: twice("continuousRendering"),
		continuousShadowMapUpdate: twice("continuousShadowMapUpdate"),
		objectControls: twice("objectControls"),
		camera: [],
		threejsData: [],
		animation: twice("animation"),
	});
});

test("SS-10565 an update without a new version is unknown, and the next frame reports like update()", async ({
	page,
}) => {
	const result = await onBothSizes(page, async (count) => {
		const perf = (window as any).__perf;
		const tools = (window as any).__tools;
		const meshes = await tools.setup(count);
		const viewport = perf.viewport;

		let before = tools.revisions();
		tools.updates.length = 0;
		viewport.update();
		const unknown = {
			report:
				tools.updates.length === 1 &&
				tools.updates[0].sceneChanges === undefined,
			channels: tools.later(before, tools.revisions()),
		};

		// The same hide, applied by update() and by the next frame.
		const hide = async (node: any, now: boolean) => {
			tools.updates.length = 0;
			before = tools.revisions();
			node.visible = false;
			node.updateVersion();
			if (now) viewport.update();
			else await perf.nextFrame();
			const update = tools.updates[0];
			return {
				events: tools.updates.length,
				kinds: tools.kindsOf(update, node),
				others: tools.othersOf(update, node),
				channels: tools.later(before, tools.revisions()),
			};
		};
		const withUpdate = await hide(meshes[0], true);
		const nextFrame = await hide(meshes[1], false);
		return {unknown, withUpdate, nextFrame};
	});
	expect(result.unknown).toEqual({report: true, channels: ["unknown"]});
	expect(result.withUpdate).toEqual({
		events: 1,
		kinds: ["visibility"],
		others: [],
		channels: ["visibility"],
	});
	expect(result.nextFrame).toEqual(result.withUpdate);
});

/**
 * Work counts (V8 block coverage, the viewer bundle only) of the edit plus
 * `updateVersion()` on the AEC facade at 20 and 80 floors (3,860 and 15,440
 * meshes), on the middle glass pane. Frames and timers are held, so only
 * the call is counted. Without V8's optimizing compilers, as `bench/count`.
 */
test.describe("SS-10565 the call", () => {
	const swiftshader = process.env.PERF_RENDERER === "swiftshader";
	/** The browser of the config, without V8's optimizing compilers. */
	const ARGS = [
		...(swiftshader
			? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
			: ["--use-angle=d3d11"]),
		"--ignore-gpu-blocklist",
		"--js-flags=--no-opt --no-maglev",
	];

	/** Runs in the page: the edits, each followed by `updateVersion()`. */
	const EDITS: Record<string, (arg?: unknown) => void> = {
		hide: () => {
			const p = (window as any).__probe;
			const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
			t.visible = !t.visible;
			t.updateVersion();
		},
		addTransformation: () => {
			const p = (window as any).__probe;
			const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
			t.addTransformation({
				id: "ss10565-add",
				matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			});
			t.updateVersion();
		},
		matrixInPlace: () => {
			const p = (window as any).__probe;
			const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
			const moved = (window as any).__ss10565Moved;
			(window as any).__ss10565Moved = !moved;
			(window as any).__ss10565Transformation.matrix = [
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				moved ? 0 : 0.05,
				0,
				0,
				1,
			];
			t.updateVersion();
		},
		dataVersion: () => {
			const p = (window as any).__probe;
			const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
			t.data[0].updateVersion();
		},
		addChild: () => {
			const p = (window as any).__probe;
			const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
			t.addChild((window as any).__ss10565Child);
			t.updateVersion();
		},
		removeChild: () => {
			const p = (window as any).__probe;
			const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
			t.removeChild((window as any).__ss10565Child);
			t.updateVersion();
		},
	};

	/**
	 * Calls and executed blocks of each edit on `origin/development` before
	 * this ticket (`4d2ea2d2f`, this test on SwiftShader, the same on 20 and
	 * 80 floors; the hide is 75/84 on a GPU too): 75/84, 73/82, 71/80,
	 * 82/90, 108/134, 97/121. With this ticket, on both renderers: 78/87,
	 * 75/84, 71/80, 84/92, 110/136, 99/123.
	 *
	 * SS-10564 adds the log of changed children: each ancestor of the node
	 * logs the branch it came from (work per level of the tree, the same on
	 * both sizes; an added or removed child walks the ancestors once more).
	 * The counts below are those of `development` with SS-10564 (production
	 * bundle, GPU). The edit may cost at most 5 calls and 10 blocks more.
	 */
	const BEFORE: Record<string, {calls: number; blocks: number}> = {
		hide: {calls: 86, blocks: 134},
		addTransformation: {calls: 83, blocks: 131},
		matrixInPlace: {calls: 79, blocks: 127},
		dataVersion: {calls: 92, blocks: 139},
		addChild: {calls: 158, blocks: 250},
		removeChild: {calls: 146, blocks: 216},
	};

	test("SS-10565 an edit plus updateVersion() costs the same on 20 and 80 floors", async ({
		playwright,
		baseURL,
	}) => {
		test.setTimeout(15 * 60_000);
		// The suite's server, whatever port it runs on.
		const origin = new URL(baseURL!).origin;
		const counts: Record<
			number,
			Record<string, {calls: number; blocks: number}>
		> = {};
		for (const floors of [20, 80]) {
			const browser = await playwright.chromium.launch({
				channel: "chrome",
				args: ARGS,
			});
			const viewer = await openCount(browser, origin);
			const {page} = viewer;
			await page.evaluate((o) => (window as any).__probe.build(o), {
				...SCENE,
				floors,
			});
			await page.evaluate(() =>
				(window as any).__probe.show({id: "default", ssao: false}),
			);
			await page.evaluate(() => {
				const SDV = (window as any).SDV;
				const p = (window as any).__probe;
				const t =
					p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
				const transformation = {
					id: "ss10565-place",
					matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
				};
				t.addTransformation(transformation);
				t.updateVersion();
				(window as any).__ss10565Transformation = transformation;
				(window as any).__ss10565Child = new SDV.TreeNode("ss10565");
			});
			counts[floors] = {};
			// The same edits in the same order on both pages. count() lets
			// the frames apply the previous edit first.
			for (const [name, edit] of Object.entries(EDITS)) {
				const {calls, blocks} = await count(viewer, name, edit);
				counts[floors][name] = {calls, blocks};
			}
			await page.close();
			await browser.close();
		}
		const result = JSON.stringify(counts);
		test.info().annotations.push({type: "counts", description: result});
		console.log(`SS-10565 call counts: ${result}`);
		for (const name of Object.keys(EDITS)) {
			expect(counts[80][name], `${name}: ${result}`).toEqual(
				counts[20][name],
			);
			const before = BEFORE[name];
			if (!before) continue;
			expect(
				counts[20][name].calls,
				`${name}: ${result}`,
			).toBeLessThanOrEqual(before.calls + 5);
			expect(
				counts[20][name].blocks,
				`${name}: ${result}`,
			).toBeLessThanOrEqual(before.blocks + 10);
		}
	});
});
