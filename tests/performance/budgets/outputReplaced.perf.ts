import {expect, test, type Page} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../fixtures/probe";
import {
	compare,
	Counters,
	createScene,
	Frame,
	frameCounters,
	isSoftwareRenderer,
	settle,
	SETTLE_MS,
	UPDATE,
	writeBaseline,
} from "./harness";

/**
 * The update after a computation (SS-10581). About 99% of users send a
 * computation and then look at a static result, so this is the step they
 * wait for most often.
 *
 * The scene is the AEC tower of the other budgets, split into the outputs of
 * one session: one output of 10 floors and five of 2 floors, 20 floors in
 * all. Each output is a tree of its own with its own materials and
 * primitives, as a glTF of its own gives.
 *
 * A computation replaces one output with new geometry of the same size. The
 * test does what the session engine does after a customization
 * (`CustomizationManager.customize`, `UtilsManager`): a new session node
 * holds the unchanged output nodes and the new one, the old session node
 * leaves the scene tree, the new one joins it and gets a new version, and
 * the viewport updates. The new output is built before the update, as the
 * glTF is parsed before it.
 *
 * Two sizes, one after the other on the same scene:
 * - `tenth`: a 2-floor output, a tenth of the scene.
 * - `half`: the 10-floor output, half of the scene.
 *
 * Each size counts the update call (`inUpdate.*`), the first frame drawn
 * after it (`firstFrame.*`), and everything until the picture has settled
 * (the rest). Times are printed and annotated, not budgeted: see `timings`.
 */

const OUTPUT_FLOORS = [10, 2, 2, 2, 2, 2];

const SIZES = [
	{name: "tenth", output: 1},
	{name: "half", output: 0},
];

const VARIANTS: SceneVariant[] = [
	// Software-safe: runs on SwiftShader too.
	{id: "outputReplaced", shadows: false, ssao: false},
	// Shadow and ambient occlusion passes. GPU only.
	{id: "outputReplacedShadowsSsao", shadows: true, ssao: true},
];

/**
 * Runs in the page. Replaces `__aec.build` with a builder of the session
 * tree described above and adds `window.__outputs`. Also adds
 * `window.__update`: a clock that the page clock does not fake, the busy
 * time of animation frames, the bounds computations and the nodes of the
 * last scene change.
 * It must not reference anything outside its own body.
 */
function installOutputs(floors: number[]) {
	const SDV = (window as any).SDV;
	const aec = (window as any).__aec;
	const buildTower = aec.build;

	// `Event.timeStamp` is real time; Playwright fakes `performance.now`.
	const now = () => new Event("t").timeStamp;

	function output(index: number, options: any) {
		const content = buildTower({
			...options,
			floors: floors[index],
			detached: true,
		});
		const below = floors.slice(0, index).reduce((a, b) => a + b, 0);
		const z = below * options.floorHeight;
		content.root.addTransformation({
			id: "output",
			matrix: new Float32Array([
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
				0,
				0,
				z,
				1,
			]),
		});
		const node = new SDV.TreeNode(`output${index}`);
		node.addChild(content.root);
		return node;
	}

	aec.build = (options: any) => {
		const session = new SDV.TreeNode("session");
		const outputs = floors.map((_, index) => output(index, options));
		for (const node of outputs) session.addChild(node);
		SDV.sceneTree.addNode(session);
		session.updateVersion();
		const side = options.baysPerSide * options.bayWidth;
		const height = floors.reduce((a, b) => a + b, 0) * options.floorHeight;
		return {
			root: session,
			outputs,
			options,
			glassNodes: [],
			mullionNodes: [],
			glassItems: [],
			items: [],
			// The camera of the 20-floor tower in `aecScene.ts`.
			camera: {
				position: [side * 2.2, -side * 3, height * 0.8],
				target: [0, 0, height / 2],
			},
		};
	};

	const state = {
		busyMs: 0,
		sceneChangeNodes: null as number | null,
		boundsComputed: 0,
		next: null as any,
	};

	const requestFrame = window.requestAnimationFrame.bind(window);
	window.requestAnimationFrame = (callback: FrameRequestCallback) =>
		requestFrame((timestamp) => {
			const start = now();
			try {
				callback(timestamp);
			} finally {
				state.busyMs += now() - start;
			}
		});

	SDV.addListener(SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, (event: any) => {
		state.sceneChangeNodes = event.sceneChanges?.nodes.length ?? -1;
	});

	let boundsTracked = false;
	/**
	 * Counts `computeBoundingBox` and `computeBoundingSphere` of geometries
	 * and batches: the structures a pick and the scene bounds read.
	 */
	function trackBounds() {
		if (boundsTracked) return;
		const probe = (window as any).__probe;
		const protos = new Set<any>();
		probe.scene.traverse((object: any) => {
			if (object.geometry)
				protos.add(Object.getPrototypeOf(object.geometry));
			if (object.isBatchedMesh) protos.add(Object.getPrototypeOf(object));
		});
		const wrapped = new Set<any>();
		for (const proto of protos) {
			for (const name of [
				"computeBoundingBox",
				"computeBoundingSphere",
			]) {
				let owner = proto;
				while (
					owner &&
					!Object.prototype.hasOwnProperty.call(owner, name)
				)
					owner = Object.getPrototypeOf(owner);
				if (!owner || wrapped.has(owner[name])) continue;
				const original = owner[name];
				const counted = function (this: unknown, ...args: any[]) {
					state.boundsComputed++;
					return original.apply(this, args);
				};
				wrapped.add(counted);
				owner[name] = counted;
			}
		}
		boundsTracked = true;
	}

	/** Builds the new output, outside the measured window. */
	function prepare(index: number) {
		const probe = (window as any).__probe;
		state.next = output(index, probe.aec.options);
	}

	/** Swaps the output in as a customization does, then updates. */
	function replace(index: number) {
		const probe = (window as any).__probe;
		const old = probe.aec.root;
		// The tree's version counter (shared/node-tree, `nextVersion`).
		const versions = () =>
			(globalThis as any)[Symbol.for("shapediver.viewer.treeVersion")]
				?.n ?? 0;
		const versionsBefore = versions();
		const start = now();
		const session = new SDV.TreeNode("session");
		probe.aec.outputs.forEach((node: any, i: number) =>
			session.addChild(i === index ? state.next : node),
		);
		// UtilsManager.removeFromSceneTree
		const parent = old.parent ?? SDV.sceneTree.root;
		SDV.sceneTree.removeNode(old);
		parent.updateVersion(true, false);
		// UtilsManager.addToSceneTree
		SDV.sceneTree.addNode(session);
		session.updateVersion();
		const swapped = now();
		const ids = versions() - versionsBefore;
		probe.aec.outputs[index] = state.next;
		probe.aec.root = session;
		state.next = null;
		probe.viewport.update();
		const end = now();
		return {ids, swapMs: swapped - start, updateMs: end - swapped};
	}

	(window as any).__update = {
		state,
		now,
		trackBounds,
		prepare,
		replace,
		reset() {
			state.busyMs = 0;
			state.sceneChangeNodes = null;
			state.boundsComputed = 0;
		},
	};
}

async function runToFirstFrame(page: Page) {
	for (let steps = 1; steps <= 100; steps++) {
		await page.waitForFunction(() =>
			(window as any).__probe.programsReady(),
		);
		await page.clock.runFor(16);
		if (await page.evaluate(() => (window as any).__probe.frames().length))
			return steps;
	}
	throw new Error("The viewer drew no frame after the output was replaced.");
}

async function read(page: Page) {
	return page.evaluate(() => {
		const probe = (window as any).__probe;
		const update = (window as any).__update;
		return {
			counters: probe.readCounters(),
			picks: probe.picks(),
			batchBoundsReads: probe.batchBoundsReads(),
			boundsComputed: update.state.boundsComputed,
			busyMs: update.state.busyMs,
		};
	});
}

async function replaceOutput(
	page: Page,
	prefix: string,
	index: number,
): Promise<Counters> {
	await page.evaluate((i) => (window as any).__update.prepare(i), index);
	await page.evaluate(() => {
		const probe = (window as any).__probe;
		probe.trackTreeDataReads();
		(window as any).__update.trackBounds();
		probe.reset();
		probe.snapshotMaterials();
		(window as any).__update.reset();
	});
	const call = await page.evaluate(
		(i) => (window as any).__update.replace(i),
		index,
	);
	const sync = await read(page);
	const steps = await runToFirstFrame(page);
	const first = await read(page);
	// Until settled: the beauty render and the blend after it.
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	const settled = await read(page);
	const result = await page.evaluate(() => {
		const probe = (window as any).__probe;
		return {
			frames: probe.frames() as Frame[],
			materials: probe.materialChanges(),
			stats: probe.stats(),
			sceneChangeNodes: (window as any).__update.state.sceneChangeNodes,
		};
	});
	const frames = result.frames;
	expect(frames.length, `${prefix}: no frame was drawn`).toBeGreaterThan(0);
	expect(
		result.sceneChangeNodes,
		`${prefix}: the viewport sent no VIEWPORT_UPDATED`,
	).not.toBeNull();

	const split = (key: string, value: (r: typeof sync) => number) => ({
		[`${prefix}.inUpdate.${key}`]: value(sync),
		[`${prefix}.firstFrame.${key}`]: value(first) - value(sync),
		[`${prefix}.${key}`]: value(settled),
	});
	const counters: Counters = {
		// Versions the swap created: the new session node, its ancestors
		// and every node below it, changed or not.
		[`${prefix}.versionsCreated`]: call.ids,
		// The nodes the scene update went through (-1: the whole tree).
		[`${prefix}.sceneChangeNodes`]: result.sceneChangeNodes as number,
		...split("treeDataReads", (r) => r.picks.treeDataReads),
		...split("updateMatrixWorldCalls", (r) => r.counters.matrixWorld.total),
		...split(
			"programCacheKeyCalls",
			(r) => r.counters.programCacheKey.calls,
		),
		...split("boundsComputed", (r) => r.boundsComputed),
		[`${prefix}.batchRebuilds`]: settled.counters.batchRebuild.calls,
		[`${prefix}.batchesCreated`]:
			settled.counters.batchedMesh.batchesCreated,
		[`${prefix}.batchesRemoved`]:
			settled.counters.batchedMesh.batchesRemoved,
		[`${prefix}.batchVertexCopies`]:
			settled.counters.batchedMesh.vertexCopies,
		[`${prefix}.batchInstancesAdded`]:
			settled.counters.batchedMesh.instancesAdded,
		[`${prefix}.batchInstancesDeleted`]:
			settled.counters.batchedMesh.instancesDeleted,
		[`${prefix}.batchMembersReapplied`]:
			settled.counters.batchedMesh.matrixWrites,
		[`${prefix}.batchBoundsReads`]: settled.batchBoundsReads,
		[`${prefix}.shadowMapRenders`]: settled.counters.shadowMap.renders,
		[`${prefix}.shadowMapLightPasses`]:
			settled.counters.shadowMap.lightPasses,
		[`${prefix}.materialsCreated`]: result.materials.created,
		[`${prefix}.materialUpdatesOutsideRender`]:
			result.materials.updatesOutsideRender,
		[`${prefix}.programsCompiledInRender`]: frames.reduce(
			(sum, frame) =>
				sum +
				frame.passes.reduce((n, pass) => n + pass.programsCreated, 0),
			0,
		),
		[`${prefix}.framesRendered`]: frames.length,
		[`${prefix}.passes`]: frames.reduce(
			(sum, frame) => sum + frame.passes.length,
			0,
		),
		...frameCounters(`${prefix}.firstFrame`, frames[0]),
		...frameCounters(`${prefix}.lastFrame`, frames[frames.length - 1]),
		[`${prefix}.scene.meshes`]: result.stats.meshes,
		[`${prefix}.scene.batchedMeshes`]: result.stats.batchedMeshes,
		[`${prefix}.scene.materials`]: result.stats.materials,
		[`${prefix}.scene.treeNodes`]: result.stats.treeNodes,
	};

	// Times are machine-dependent: reported, never compared. `inCall` is the
	// update call; the other two add the main-thread time of the animation
	// frames up to the first drawn frame and until the picture settled.
	// The paused page clock removes idle time, and shader compiles in the
	// driver's own threads are not in it.
	const timings = {
		clockSteps: steps,
		swapMs: round(call.swapMs),
		inCallMs: round(call.updateMs),
		untilFirstFrameMs: round(call.swapMs + call.updateMs + first.busyMs),
		untilSettledMs: round(call.swapMs + call.updateMs + settled.busyMs),
	};
	console.log(`${prefix}: ${JSON.stringify(timings)}`);
	test.info().annotations.push({
		type: "timings",
		description: `${prefix}: ${JSON.stringify(timings)}`,
	});
	return counters;
}

function round(ms: number) {
	return Math.round(ms * 10) / 10;
}

for (const variant of VARIANTS) {
	test(`budget: AEC facade, ${variant.id}`, async ({page}) => {
		await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
		await openViewer(page, "/index.html", {counters: true});
		const software = await isSoftwareRenderer(page);
		test.skip(
			variant.shadows && software,
			"This viewer disables shadows on a software renderer.",
		);
		if (software) test.setTimeout(900_000);
		else test.setTimeout(300_000);

		await page.evaluate(installOutputs, OUTPUT_FLOORS);
		await createScene(page, variant, AEC_DEFAULT);
		await settle(page);

		const counters: Counters = {};
		for (const size of SIZES)
			Object.assign(
				counters,
				await replaceOutput(page, size.name, size.output),
			);

		if (UPDATE) {
			writeBaseline(variant.id, counters);
			return;
		}
		expect(compare(variant.id, counters).join("\n")).toBe("");
	});
}
