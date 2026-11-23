import {expect, test, type Page} from "@playwright/test";
import {AEC_DEFAULT, aecSceneCounts} from "../fixtures/aecScene";
import {
	openViewer,
	type PassRecord,
	type SceneVariant,
} from "../fixtures/probe";
import {
	compare,
	Counters,
	Frame,
	frameCounters,
	isSoftwareRenderer,
	SETTLE_MS,
	UPDATE,
	writeBaseline,
} from "./harness";

const VARIANTS: SceneVariant[] = [
	{id: "default", shadows: true, ssao: false},
	{id: "ssao", shadows: true, ssao: true},
	// SwiftShader disables shadows in this viewer. These two run there too.
	{id: "noShadows", shadows: false, ssao: false},
	{id: "noShadowsSsao", shadows: false, ssao: true},
];

/**
 * Runs the page clock one animation frame (16 ms) at a time, after the last
 * `reset`, until the viewer has drawn one frame. Before each step it waits
 * for every shader compile. The viewer draws once the compiles are done
 * (SS-10384), and a compile takes real time while the clock is paused, so
 * without the wait the number of steps would follow the speed of the
 * driver. Returns the steps taken: the first drawn frame is the last one.
 */
async function runToFirstFrame(page: Page) {
	for (let steps = 1; steps <= 100; steps++) {
		await page.waitForFunction(() =>
			(window as any).__probe.programsReady(),
		);
		await page.clock.runFor(16);
		if (await page.evaluate(() => (window as any).__probe.frames().length))
			return steps;
	}
	throw new Error("The viewer drew no frame after the one-node change.");
}

async function collect(page: Page, variant: SceneVariant): Promise<Counters> {
	const gpu = await page.evaluate(
		([v, options]) => (window as any).__probe.create(v, options),
		[variant, AEC_DEFAULT] as const,
	);
	test.info().annotations.push({type: "gpu", description: gpu});
	// From here on time moves only through runFor. Without the pause the
	// clock also follows real time and the frame counts vary per run.
	await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
	await page.clock.runFor(SETTLE_MS);
	// Image decoding is real time. Let late textures arrive before counting.
	await page.waitForTimeout(1500);
	await page.clock.runFor(SETTLE_MS);

	const stats = await page.evaluate(() => (window as any).__probe.stats());
	const expected = aecSceneCounts(AEC_DEFAULT);
	// The generator and the viewer must agree before any budget means much.
	expect(
		await page.evaluate(() => {
			const aec = (window as any).__probe.aec;
			return {meshes: aec.meshes, treeNodes: aec.treeNodes};
		}),
	).toEqual({meshes: expected.meshes, treeNodes: expected.treeNodes});

	const counters: Counters = {};
	// From the scene build until it settled: programs compiled inside a draw
	// make that frame wait for the driver (SS-10384).
	counters["load.programsCompiledInRender"] = await page.evaluate(() =>
		((window as any).__probe.passes as PassRecord[]).reduce(
			(sum, pass) => sum + pass.programsCreated,
			0,
		),
	);
	// Programs, geometries and textures are counted at the end (`final.*`).
	// Some are created lazily during the first camera move, so a count taken
	// here flips by one between runs.
	const lazy = ["programs", "geometries", "textures"];
	for (const [key, value] of Object.entries(stats))
		if (!lazy.includes(key)) counters[`scene.${key}`] = value as number;

	// 1 s without input.
	await page.evaluate(() => (window as any).__probe.reset());
	await page.clock.runFor(1000);
	counters["idle.renderCalls"] = await page.evaluate(
		() => (window as any).__probe.passes.length,
	);

	// A camera drag, then the beauty render that follows it.
	await page.evaluate(() => {
		(window as any).__probe.reset();
		(window as any).__probe.snapshotMaterials();
	});
	await page.mouse.move(600, 360);
	await page.mouse.down();
	for (let step = 1; step <= 4; step++) {
		await page.mouse.move(600 + step * 20, 360 + step * 10);
		await page.clock.runFor(32);
	}
	await page.mouse.up();
	await page.clock.runFor(SETTLE_MS);
	const move = await page.evaluate(() => ({
		frames: (window as any).__probe.frames(),
		materials: (window as any).__probe.materialChanges(),
		batchBoundsReads: (window as any).__probe.batchBoundsReads(),
		counters: (window as any).__probe.readCounters(),
	}));
	const frames = move.frames as Frame[];
	expect(frames.length, "the camera drag did not render").toBeGreaterThan(1);
	Object.assign(
		counters,
		frameCounters("cameraFrame", frames[0]),
		frameCounters("beautyFrame", frames[frames.length - 1]),
	);
	// Frames from the first drag step to the end of the beauty blend.
	if (variant.ssao) {
		// Sizes, not times: the viewport is 1280x720 at pixel ratio 1, so these
		// are the same on every machine. The default ambient occlusion target
		// is half the canvas, and a full size target is the cost before
		// SS-10440.
		const targets = await page.evaluate(() =>
			(window as any).__probe.aoTargets(),
		);
		expect(targets, "the SSAO effect was not found").not.toBeNull();
		counters["ssao.canvasWidth"] = targets.canvas.width;
		counters["ssao.canvasHeight"] = targets.canvas.height;
		counters["ssao.aoTargetWidth"] = targets.ao.width;
		counters["ssao.aoTargetHeight"] = targets.ao.height;
		counters["ssao.denoiseTargetWidth"] = targets.denoise.width;
		counters["ssao.denoiseTargetHeight"] = targets.denoise.height;
		for (const [prefix, frame] of [
			["cameraFrame", frames[0]],
			["beautyFrame", frames[frames.length - 1]],
		] as const) {
			// What the frame actually drew into, not what the effect reports.
			const sizes = frame.passes
				.filter((pass) => !pass.main)
				.map((pass) => pass.pixels);
			counters[`${prefix}.fullScreenPixels`] = sizes.reduce(
				(sum, pixels) => sum + pixels,
				0,
			);
			counters[`${prefix}.smallestFullScreenTargetPixels`] = Math.min(
				...sizes,
			);
		}
	}
	counters["cameraMove.framesRendered"] = frames.length;
	// Per-instance bounds reads while batches sort and cull, all passes.
	counters["cameraMove.batchBoundsReads"] = move.batchBoundsReads;
	counters["cameraMove.materialUpdatesOutsideRender"] =
		move.materials.updatesOutsideRender;
	counters["cameraMove.materialsCreated"] = move.materials.created;
	// Calls made inside `renderer.render` while the first drag frame drew.
	counters["cameraFrame.updateMatrixWorldCalls"] =
		move.counters.matrixWorld.byFrame[frames[0].frame] ?? 0;
	// SS-10485: calls of the SDObject override that left a branch out.
	counters["cameraFrame.updateMatrixWorldSkips"] =
		move.counters.matrixWorld.skipsByFrame[frames[0].frame] ?? 0;
	// The last frame of the beauty blend, no input before it.
	counters["beautyFrame.updateMatrixWorldCalls"] =
		move.counters.matrixWorld.byFrame[frames[frames.length - 1].frame] ?? 0;

	// One hidden glass pane. The `oneNodeChange.*` counters below cover the
	// change and the first frame drawn after it.
	await page.evaluate(() => {
		(window as any).__probe.trackTreeDataReads();
		(window as any).__probe.reset();
		// The nodes the scene update went through (-1: the whole tree).
		(window as any).__sceneChangeNodes = null;
		const SDV = (window as any).SDV;
		SDV.addListener(
			SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			(event: any) => {
				(window as any).__sceneChangeNodes =
					event.sceneChanges?.nodes.length ?? -1;
			},
		);
	});
	const change = await page.evaluate(() =>
		(window as any).__probe.oneNodeChange(),
	);
	counters["oneNodeChange.treeNodesReversioned"] = change.reversioned;
	counters["oneNodeChange.treeNodesRead"] = change.nodesRead;
	counters["oneNodeChange.batchesRebuilt"] = change.batchesRebuilt;

	// The change itself, as far as the sync update goes.
	const sync = await page.evaluate(() =>
		(window as any).__probe.readCounters(),
	);
	// And the first frame drawn after it, nothing later: the per-frame cost
	// is `cameraFrame.*`. A frame the viewer skips while a shader compiles
	// is inside the window, so is a compile wait.
	const steps = await runToFirstFrame(page);
	const update = await page.evaluate(() => ({
		counters: (window as any).__probe.readCounters(),
		picks: (window as any).__probe.picks(),
		frames: (window as any).__probe.frames().length,
	}));
	// Printed so a reader of the run can see how the values split.
	console.log(
		`oneNodeChange window, ${variant.id}: ` +
			JSON.stringify({
				clockSteps: steps,
				framesDrawn: update.frames,
				updateMatrixWorldInUpdate: sync.matrixWorld.total,
				updateMatrixWorldInFrame:
					update.counters.matrixWorld.total - sync.matrixWorld.total,
				programCacheKeyInUpdate: sync.programCacheKey.calls,
				programCacheKeyInFrame:
					update.counters.programCacheKey.calls -
					sync.programCacheKey.calls,
			}),
	);
	counters["oneNodeChange.programCacheKeyCalls"] =
		update.counters.programCacheKey.calls;
	counters["oneNodeChange.updateMatrixWorldCalls"] =
		update.counters.matrixWorld.total;
	counters["oneNodeChange.treeDataReads"] = update.picks.treeDataReads;
	counters["oneNodeChange.sceneChangeNodes"] = await page.evaluate(
		() => (window as any).__sceneChangeNodes,
	);

	// After everything above, so late compiles and uploads are included.
	await page.clock.runFor(500);
	const after = await page.evaluate(() => (window as any).__probe.stats());
	counters["final.programs"] = after.programs;
	counters["final.geometries"] = after.geometries;
	counters["final.textures"] = after.textures;

	// Last: the whole fixture is re-versioned, as adding a session does.
	counters["versionUpdate.idsCreated"] = await page.evaluate(() =>
		(window as any).__probe.versionUpdate(),
	);
	return counters;
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
		// Full-resolution ambient occlusion over ~160 frames is slow in software.
		if (software) test.setTimeout(900_000);

		const counters = await collect(page, variant);
		if (UPDATE) {
			writeBaseline(variant.id, counters);
			return;
		}
		expect(compare(variant.id, counters).join("\n")).toBe("");
	});
}
