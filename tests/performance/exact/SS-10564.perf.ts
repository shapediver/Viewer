import {expect, type CDPSession} from "@playwright/test";
import * as fs from "fs";
import {
	open as openCount,
	SCENE,
	settle,
	type Viewer,
} from "../bench/count/context";
import {test} from "./harness";

/**
 * SS-10564: the update of one scene-tree node costs the node and the tree
 * depth, not the scene size.
 *
 * Work counts (V8 block coverage of the viewer bundle, optimizing compilers
 * off, as `bench/count`) of a hide, a show and a move of the middle glass
 * pane of the AEC facade at 20 and 80 floors (3,860 and 15,440 meshes),
 * after a warm-up of each:
 *
 * 1. The call, the edit plus `updateVersion()`.
 * 2. `viewport.update()` right after the edit.
 * 3. The next frame without `viewport.update()`, minus the next frame after
 *    the same edit applied by `viewport.update()`: the scene-update part of
 *    the frame. Drawing is paused in both frames: the picture is not the
 *    update (SS-10566, SS-10606), and a frame that draws after its own
 *    scene update reads the scene through another branch of the render-list
 *    cut than one that draws after `viewport.update()` or
 *    `viewport.render()`.
 *
 * Each is the same on both sizes. Animation frames and timers are held
 * around every count. Shadows are off: their redraw after a change is
 * SS-10566. No pixels, no timing: software-renderer safe.
 */

type Counts = {calls: number; blocks: number};

/** What the next coverage reads are, for `COUNT_DUMP`. */
let dumpLabel = "";

/** The browser of the config, without V8's optimizing compilers. */
function launchArgs() {
	const swiftshader = process.env.PERF_RENDERER === "swiftshader";
	return [
		...(swiftshader
			? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
			: ["--use-angle=d3d11"]),
		"--ignore-gpu-blocklist",
		"--js-flags=--no-opt --no-maglev",
	];
}

/** Runs in the page: the edits, each followed by `updateVersion()`. */
const EDITS: Record<string, () => void> = {
	hide: () => {
		const p = (window as any).__probe;
		const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
		t.visible = false;
		t.updateVersion();
	},
	show: () => {
		const p = (window as any).__probe;
		const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
		t.visible = true;
		t.updateVersion();
	},
	move: () => {
		const p = (window as any).__probe;
		const t = p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
		const moved = (window as any).__ss10564Moved;
		(window as any).__ss10564Moved = !moved;
		(window as any).__ss10564Transformation.matrix = [
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
};

/**
 * Calls and executed blocks of the viewer bundle since the last read. With
 * `COUNT_DUMP=<file>`, one line per read with the calls and blocks per
 * function (name and offset in the bundle), to find what differs.
 */
async function coverage(cdp: CDPSession, origin: string): Promise<Counts> {
	const {result} = await cdp.send("Profiler.takePreciseCoverage");
	let calls = 0;
	let blocks = 0;
	const perFunction: Record<string, [number, number]> = {};
	for (const script of result) {
		if (!script.url.startsWith(origin)) continue;
		for (const fn of script.functions) {
			const first = fn.ranges[0];
			if (!first || first.count === 0) continue;
			calls += first.count;
			let fnBlocks = 0;
			for (const range of fn.ranges) fnBlocks += range.count;
			blocks += fnBlocks;
			perFunction[`${fn.functionName}@${first.startOffset}`] = [
				first.count,
				fnBlocks,
			];
		}
	}
	if (process.env.COUNT_DUMP)
		fs.appendFileSync(
			process.env.COUNT_DUMP,
			JSON.stringify({label: dumpLabel, calls, blocks, perFunction}) +
				"\n",
		);
	return {calls, blocks};
}

/**
 * The call (edit plus `updateVersion()`) and `viewport.update()` right
 * after it, counted apart, with no frame in between.
 */
async function callAndUpdate(viewer: Viewer, edit: () => void) {
	const {page, cdp, origin} = viewer;
	await settle(viewer);
	await page.evaluate(() => (window as any).__count.hold());
	await cdp.send("Profiler.takePreciseCoverage");
	await page.evaluate(edit);
	const call = await coverage(cdp, origin);
	await page.evaluate(() => (window as any).__probe.viewport.update());
	const update = await coverage(cdp, origin);
	await page.evaluate(() => (window as any).__count.release());
	return {call, update};
}

/**
 * The first frame after `before` (not counted), and with `update` after a
 * `viewport.update()` that applies it: frames are held, the frame comes
 * due, and only its callbacks are counted.
 */
async function nextFrame(viewer: Viewer, before: () => void, update = false) {
	const {page, cdp, origin} = viewer;
	await settle(viewer);
	// The frame does not draw: the picture is not the update, and the draw
	// after a scene update in the frame reads the scene through another
	// branch of the render-list cut than the draw after `viewport.update()`.
	await page.evaluate(() =>
		(window as any).__probe.viewport.pauseRendering(),
	);
	await page.evaluate(() => (window as any).__count.hold());
	await page.evaluate(before);
	if (update)
		await page.evaluate(() => (window as any).__probe.viewport.update());
	// Waited for outside the page: the page's frames and timers are held,
	// a polling wait in the page would be held too.
	let queued = 0;
	for (let i = 0; i < 50 && queued === 0; i++) {
		await page.waitForTimeout(100);
		queued = await page.evaluate(() => (window as any).__count.queued());
	}
	if (queued === 0) throw new Error("No frame came due");
	await cdp.send("Profiler.takePreciseCoverage");
	// Only the frame: frames and timers are held again right after it. The
	// clock stands a second back while it runs, so the frame-rate panel,
	// which redraws once a second, does not redraw in it.
	await page.evaluate(() => {
		const count = (window as any).__count;
		const now = performance.now;
		const frozen = now.call(performance) - 1000;
		performance.now = () => frozen;
		try {
			count.release();
		} finally {
			count.hold();
			performance.now = now;
		}
	});
	const counts = await coverage(cdp, origin);
	await page.evaluate(() => {
		(window as any).__probe.viewport.continueRendering();
		(window as any).__count.release();
	});
	return counts;
}

/** The edit that takes each edit back. */
const UNDO: Record<string, string> = {hide: "show", show: "hide", move: "move"};

test.describe.serial("SS-10564 one node on 20 and 80 floors", () => {
	/** Per floor count and edit: the call, the update, the frame. */
	const counts: Record<
		number,
		Record<string, {call: Counts; update: Counts; frame: Counts}>
	> = {};

	test.beforeAll(async ({playwright}, testInfo) => {
		testInfo.setTimeout(20 * 60_000);
		// The suite's server, whatever port it runs on.
		const origin = new URL(testInfo.project.use.baseURL!).origin;
		for (const floors of [20, 80]) {
			const browser = await playwright.chromium.launch({
				channel: "chrome",
				args: launchArgs(),
			});
			const viewer = await openCount(browser, origin);
			const {page} = viewer;
			await page.evaluate((o) => (window as any).__probe.build(o), {
				...SCENE,
				floors,
			});
			await page.evaluate(() => {
				const p = (window as any).__probe;
				p.viewport.shadows = false;
				p.viewport.softShadows = false;
				// The beauty pass starts on a timer after each draw. A timer
				// that comes due while a count waits for its frame runs in
				// that frame; 2 s is longer than any wait.
				p.viewport.beautyRenderDelay = 2000;
				p.show({id: "default", ssao: false});
				const t =
					p.aec.glassNodes[Math.floor(p.aec.glassNodes.length / 2)];
				const transformation = {
					id: "ss10564-move",
					matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
				};
				t.addTransformation(transformation);
				t.updateVersion();
				(window as any).__ss10564Transformation = transformation;
			});
			// Warm-up: each edit once with an update and once by a frame.
			for (const edit of Object.values(EDITS)) {
				await callAndUpdate(viewer, edit);
				await nextFrame(viewer, edit);
			}
			// The two moves above cancel each other out. Hide, show and move
			// leave the pane as it was, after a second move back.
			const calls: Record<string, {call: Counts; update: Counts}> = {};
			for (const [name, edit] of Object.entries(EDITS)) {
				dumpLabel = `${floors} ${name} call+update`;
				calls[name] = await callAndUpdate(viewer, edit);
			}
			dumpLabel = "";
			await callAndUpdate(viewer, EDITS.move);
			counts[floors] = {};
			for (const [name, edit] of Object.entries(EDITS)) {
				dumpLabel = `${floors} ${name} frame`;
				const edited = await nextFrame(viewer, edit);
				dumpLabel = "";
				// The same edit again, applied by viewport.update() before
				// the frame: the frame draws the same picture, without the
				// scene update.
				await callAndUpdate(viewer, EDITS[UNDO[name]]);
				dumpLabel = `${floors} ${name} plain frame`;
				const plain = await nextFrame(viewer, edit, true);
				dumpLabel = "";
				counts[floors][name] = {
					...calls[name],
					frame: {
						calls: edited.calls - plain.calls,
						blocks: edited.blocks - plain.blocks,
					},
				};
			}
			await nextFrame(viewer, EDITS.move);
			await page.close();
			await browser.close();
		}
		const result = JSON.stringify(counts);
		testInfo.annotations.push({type: "counts", description: result});
		console.log(`SS-10564 counts: ${result}`);
	});

	for (const part of ["call", "update", "frame"] as const) {
		test(`SS-10564 ${part}: the same work on 20 and 80 floors`, () => {
			for (const name of Object.keys(EDITS))
				expect(
					counts[80][name][part],
					`${name}: ${JSON.stringify(counts)}`,
				).toEqual(counts[20][name][part]);
		});
	}
});
