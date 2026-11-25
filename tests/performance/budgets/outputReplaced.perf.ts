import {expect, test, type CDPSession, type Page} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../fixtures/probe";
import {installOutputs, OUTPUT_FLOORS} from "../fixtures/sessionOutputs";
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
 * The session tree and the swap are in `fixtures/sessionOutputs.ts`.
 */

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
 * One hover on the tower and off it again, before anything is counted, so the
 * pick indexes exist and the updates have to keep them current.
 */
async function pickOnce(page: Page) {
	const box = await page.evaluate(() => (window as any).__probe.canvasRect());
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.clock.runFor(100);
	expect(
		await page.evaluate(() => (window as any).__update.state.hovers),
		"the hover before the first replacement hit no output",
	).toBeGreaterThan(0);
	await page.mouse.move(box.x + 2, box.y + 2);
	// `settle` pauses the clock at a fixed time, so it runs once per test.
	for (let i = 0; i < 2; i++) {
		await page.waitForFunction(() =>
			(window as any).__probe.programsReady(),
		);
		await page.clock.runFor(SETTLE_MS);
	}
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
			programsCreated: update.state.programsCreated,
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
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Performance.enable");
	const before = await taskMs(cdp);
	const call = await page.evaluate(
		(i) => (window as any).__update.replace(i),
		index,
	);
	const inCall = await taskMs(cdp);
	const sync = await read(page);
	const steps = await runToFirstFrame(page);
	const firstFrame = await taskMs(cdp);
	const first = await read(page);
	// Until settled: the beauty render and the blend after it.
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	const settledAt = await taskMs(cdp);
	const settled = await read(page);
	await cdp.detach();
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
		// Programs compiled anywhere: the viewer compiles ahead of the draw
		// (`renderer.compile`), which `programsCompiledInRender` misses.
		...split("programsCreated", (r) => r.programsCreated),
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

	// Times are machine-dependent: reported, never compared. All three are
	// the main-thread busy time from the start of the update call: to its end,
	// to the first drawn frame, and until the picture settled. The paused page
	// clock removes idle time. Shader compiles in the driver's own threads are
	// not in it; the test's own polling is, by a few ms.
	const timings = {
		clockSteps: steps,
		inCallMs: round(inCall - before),
		untilFirstFrameMs: round(firstFrame - before),
		untilSettledMs: round(settledAt - before),
	};
	console.log(`${prefix}: ${JSON.stringify(timings)}`);
	test.info().annotations.push({
		type: "timings",
		description: `${prefix}: ${JSON.stringify(timings)}`,
	});
	return counters;
}

/**
 * Main-thread busy time of the page in ms, from Chrome's `TaskDuration`.
 * Playwright's clock fakes every clock in the page (`performance`,
 * `Event.timeStamp`, also in frames), so the time is read over CDP.
 */
async function taskMs(cdp: CDPSession) {
	const {metrics} = await cdp.send("Performance.getMetrics");
	return (metrics.find((m) => m.name === "TaskDuration")?.value ?? 0) * 1000;
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
		// The standard lights a session gets, so the shadow variant has a
		// light that casts a shadow. The AEC scene alone has no lights.
		await page.evaluate(() =>
			(window as any).__probe.viewport.createLightScene({standard: true}),
		);
		await page.evaluate(() => (window as any).__update.setupHover());
		await settle(page);
		await pickOnce(page);

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
