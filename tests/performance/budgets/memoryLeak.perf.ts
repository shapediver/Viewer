import {expect, test, type Page} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {gpuMemory, jsHeap, megabytes, type JsHeap} from "../fixtures/memory";
import {openViewer, type SceneVariant} from "../fixtures/probe";
import {installOutputs} from "../fixtures/sessionOutputs";
import {
	createScene,
	isSoftwareRenderer,
	settle,
	SETTLE_MS,
	UPDATE,
} from "./harness";

/**
 * Leak test (SS-10582). Users change parameters many times in one visit, so
 * what a computation leaves behind adds up.
 *
 * The scene is a smaller session of the kind `outputReplaced` uses
 * (`fixtures/sessionOutputs.ts`): outputs of 2, 1 and 1 floors on a
 * 640 x 360 canvas. What a computation leaks does not depend on the size of the
 * scene. Each computation replaces the same 1-floor output with new geometry
 * of the same size, as the session engine does, and lets the picture settle.
 * Memory is read after computation 10 (caches and programs are warm by then),
 * midway and after the last one:
 * - the GPU allocations and three.js' counts must be equal;
 * - the JavaScript heap after a forced garbage collection may grow by at
 *   most `HEAP_TOLERANCE` in all, and not by more than `HEAP_TREND_BYTES` in
 *   both halves.
 *
 * Not a budget: there is no baseline, the test passes or fails, and
 * `UPDATE_BUDGETS=1` skips it. `LEAK_COMPUTATIONS` sets the number of
 * computations: 100 by default, 40 on a software renderer. 100 took 5 minutes
 * on SwiftShader on a fast desktop, and the CI budgets job (20 minutes, about
 * 5.5 of them used by the other budgets) runs on slower machines.
 */

function computationCount(software: boolean) {
	return Number(process.env.LEAK_COMPUTATIONS ?? (software ? 40 : 100));
}
const CHECKPOINT = 10;
const FLOORS = [2, 1, 1];
/** The output that is replaced: a 1-floor output. */
const OUTPUT = 1;
/** Heap growth allowed between the two readings: the larger of the two. */
const HEAP_TOLERANCE = {bytes: 1024 * 1024, share: 0.01};
/**
 * A slow leak stays under `HEAP_TOLERANCE` (1 MB over 90 computations lets
 * about 11 KB per computation through), but grows in both halves of the run.
 * The test fails when the heap grows by more than this in each half, about
 * 6 KB per computation at the default count.
 */
const HEAP_TREND_BYTES = 256 * 1024;

const VARIANTS: SceneVariant[] = [
	// Software-safe: runs on SwiftShader too.
	{id: "memoryLeak", shadows: false, ssao: false},
	// Shadow maps and ambient occlusion targets. GPU only.
	{id: "memoryLeakShadowsSsao", shadows: true, ssao: true},
];

async function hoverOnce(page: Page) {
	const box = await page.evaluate(() => (window as any).__probe.canvasRect());
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.clock.runFor(100);
	expect(
		await page.evaluate(() => (window as any).__update.state.hovers),
		"the hover before the first computation hit no output",
	).toBeGreaterThan(0);
	await page.mouse.move(box.x + 2, box.y + 2);
	await page.clock.runFor(100);
}

async function compute(page: Page) {
	await page.evaluate((i) => (window as any).__update.prepare(i), OUTPUT);
	await page.evaluate((i) => (window as any).__update.replace(i), OUTPUT);
	// Until settled: shader compiles, the beauty render and the blend.
	for (let pass = 0; pass < 2; pass++) {
		await page.waitForFunction(() =>
			(window as any).__probe.programsReady(),
		);
		await page.clock.runFor(SETTLE_MS);
	}
	// The probe keeps a record of every pass drawn; drop it, it is not the
	// viewer's memory.
	await page.evaluate(() => (window as any).__probe.reset());
}

async function snapshot(page: Page) {
	const counters = await gpuMemory(page, "memory");
	const scene = await page.evaluate(() => {
		const stats = (window as any).__probe.stats();
		return {
			"memory.scene.meshes": stats.meshes as number,
			"memory.scene.batchedMeshes": stats.batchedMeshes as number,
			"memory.scene.materials": stats.materials as number,
			"memory.scene.treeNodes": stats.treeNodes as number,
		};
	});
	return {counters: {...counters, ...scene}, heap: await jsHeap(page)};
}

function describe(
	label: string,
	counters: Record<string, number>,
	heap: JsHeap,
) {
	return `${label}: ${JSON.stringify({
		gpuMB: megabytes(counters["memory.gpu.totalBytes"]),
		heapMB: megabytes(heap.usedBytes),
		backingStorageMB: megabytes(heap.backingStorageBytes),
	})}`;
}

for (const variant of VARIANTS) {
	test(`leak: AEC facade, ${variant.id}`, async ({page}) => {
		test.skip(UPDATE, "No baseline: UPDATE_BUDGETS has nothing to write.");
		await page.setViewportSize({width: 640, height: 360});
		await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
		await openViewer(page, "/index.html", {counters: true});
		const software = await isSoftwareRenderer(page);
		const COMPUTATIONS = computationCount(software);
		expect(
			COMPUTATIONS,
			`LEAK_COMPUTATIONS must be above ${CHECKPOINT}`,
		).toBeGreaterThan(CHECKPOINT);
		test.skip(
			variant.shadows && software,
			"This viewer disables shadows on a software renderer.",
		);
		test.setTimeout(1_200_000);

		await page.evaluate(installOutputs, FLOORS);
		await createScene(page, variant, AEC_DEFAULT);
		// As in `outputReplaced`: the standard lights of a session, and hover
		// on the outputs with one hover before the first computation, so the
		// pick indexes exist and every computation has to update them.
		await page.evaluate(() => {
			(window as any).__probe.viewport.createLightScene({standard: true});
			(window as any).__update.setupHover();
		});
		await settle(page);
		await hoverOnce(page);

		const midpoint = Math.round((CHECKPOINT + COMPUTATIONS) / 2);
		let warm: Awaited<ReturnType<typeof snapshot>> | undefined;
		let mid: Awaited<ReturnType<typeof snapshot>> | undefined;
		for (let computation = 1; computation <= COMPUTATIONS; computation++) {
			await compute(page);
			if (computation === CHECKPOINT) warm = await snapshot(page);
			if (computation === midpoint) mid = await snapshot(page);
		}
		const last = await snapshot(page);
		if (!warm || !mid) throw new Error("No reading after the checkpoint.");

		for (const line of [
			describe(
				`${variant.id} after ${CHECKPOINT}`,
				warm.counters,
				warm.heap,
			),
			describe(`${variant.id} after ${midpoint}`, mid.counters, mid.heap),
			describe(
				`${variant.id} after ${COMPUTATIONS}`,
				last.counters,
				last.heap,
			),
		]) {
			console.log(line);
			test.info().annotations.push({type: "memory", description: line});
		}

		expect(
			mid.counters,
			`GPU allocations or scene counts after computation ${midpoint} differ from those after computation ${CHECKPOINT}`,
		).toEqual(warm.counters);
		expect(
			last.counters,
			`GPU allocations or scene counts after computation ${COMPUTATIONS} differ from those after computation ${CHECKPOINT}`,
		).toEqual(warm.counters);
		const halves = [
			mid.heap.totalBytes - warm.heap.totalBytes,
			last.heap.totalBytes - mid.heap.totalBytes,
		];
		expect(
			Math.min(...halves),
			`The heap grew in both halves of the run (${halves.map(megabytes).join(" MB, ")} MB), each more than ${megabytes(HEAP_TREND_BYTES)} MB`,
		).toBeLessThanOrEqual(HEAP_TREND_BYTES);
		const growth = last.heap.totalBytes - warm.heap.totalBytes;
		const allowed = Math.max(
			HEAP_TOLERANCE.bytes,
			warm.heap.totalBytes * HEAP_TOLERANCE.share,
		);
		expect(
			growth,
			`The heap grew by ${megabytes(growth)} MB from computation ${CHECKPOINT} to ${COMPUTATIONS}, more than ${megabytes(allowed)} MB`,
		).toBeLessThanOrEqual(allowed);
	});
}
