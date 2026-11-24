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
 * 640 x 360 canvas, so 100 computations stay affordable on the software
 * renderer. What a computation leaks does not depend on the size of the
 * scene. Each computation replaces the same 1-floor output with new geometry
 * of the same size, as the session engine does, and lets the picture settle.
 * Memory is read after computation 10 (caches and programs are warm by then)
 * and after the last one:
 * - the GPU allocations and three.js' counts must be equal;
 * - the JavaScript heap after a forced garbage collection may grow by at
 *   most `HEAP_TOLERANCE`.
 *
 * Not a budget: there is no baseline, the test passes or fails, and
 * `UPDATE_BUDGETS=1` skips it. `LEAK_COMPUTATIONS` sets the number of
 * computations (default 100).
 */

const COMPUTATIONS = Number(process.env.LEAK_COMPUTATIONS ?? 100);
const CHECKPOINT = 10;
const FLOORS = [2, 1, 1];
/** The output that is replaced: a 1-floor output. */
const OUTPUT = 1;
/** Heap growth allowed between the two readings: the larger of the two. */
const HEAP_TOLERANCE = {bytes: 1024 * 1024, share: 0.01};

const VARIANTS: SceneVariant[] = [
	// Software-safe: runs on SwiftShader too.
	{id: "memoryLeak", shadows: false, ssao: false},
	// Shadow maps and ambient occlusion targets. GPU only.
	{id: "memoryLeakShadowsSsao", shadows: true, ssao: true},
];

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
	test(`leak: AEC facade, ${variant.id}, ${COMPUTATIONS} computations`, async ({
		page,
	}) => {
		expect(
			COMPUTATIONS,
			`LEAK_COMPUTATIONS must be above ${CHECKPOINT}`,
		).toBeGreaterThan(CHECKPOINT);
		test.skip(UPDATE, "No baseline: UPDATE_BUDGETS has nothing to write.");
		await page.setViewportSize({width: 640, height: 360});
		await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
		await openViewer(page, "/index.html", {counters: true});
		const software = await isSoftwareRenderer(page);
		test.skip(
			variant.shadows && software,
			"This viewer disables shadows on a software renderer.",
		);
		test.setTimeout(software ? 3_600_000 : 1_200_000);

		await page.evaluate(installOutputs, FLOORS);
		await createScene(page, variant, AEC_DEFAULT);
		await settle(page);

		let warm: Awaited<ReturnType<typeof snapshot>> | undefined;
		for (let computation = 1; computation <= COMPUTATIONS; computation++) {
			await compute(page);
			if (computation === CHECKPOINT) warm = await snapshot(page);
		}
		const last = await snapshot(page);
		if (!warm) throw new Error("No reading after the checkpoint.");

		for (const line of [
			describe(
				`${variant.id} after ${CHECKPOINT}`,
				warm.counters,
				warm.heap,
			),
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
			last.counters,
			`GPU allocations or scene counts after computation ${COMPUTATIONS} differ from those after computation ${CHECKPOINT}`,
		).toEqual(warm.counters);
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
