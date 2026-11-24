import {expect, test} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {gpuMemory, jsHeap, megabytes} from "../fixtures/memory";
import {openViewer, type SceneVariant} from "../fixtures/probe";
import {
	compare,
	createScene,
	isSoftwareRenderer,
	orbitStep,
	settle,
	SETTLE_MS,
	UPDATE,
	writeBaseline,
} from "./harness";

/**
 * Memory of the AEC facade once it has settled (SS-10582), one figure per
 * rendering variant: shadow maps and ambient occlusion are render targets of
 * their own.
 *
 * The GPU side is what the viewer allocates on its WebGL context
 * (`fixtures/counters/gpuMemory.ts`): buffers, textures, render targets and
 * renderbuffers with their bytes, plus three.js' own counts. It is exact,
 * so it is compared with the baseline. It is a count of what the viewer asks
 * for, not what the driver uses.
 *
 * The JavaScript heap after a forced garbage collection is printed and
 * annotated, not compared: it depends on the browser version and on V8.
 */

const VARIANTS: SceneVariant[] = [
	// Software-safe: run on SwiftShader too.
	{id: "memory", shadows: false, ssao: false},
	{id: "memorySsao", shadows: false, ssao: true},
	// Shadow maps. GPU only.
	{id: "memoryShadows", shadows: true, ssao: false},
	{id: "memoryShadowsSsao", shadows: true, ssao: true},
];

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

		await createScene(page, variant, AEC_DEFAULT);
		// The standard lights a session gets: without a light that casts a
		// shadow, the shadow variants allocate no shadow map.
		await page.evaluate(() =>
			(window as any).__probe.viewport.createLightScene({standard: true}),
		);
		await settle(page);
		// Some programs, geometries and textures are created lazily on the
		// first camera move (see `final.*` in `facade.perf.ts`). Move once and
		// settle again, waiting for shader compiles, so the reading is stable.
		await orbitStep(page);
		for (let pass = 0; pass < 2; pass++) {
			await page.waitForFunction(() =>
				(window as any).__probe.programsReady(),
			);
			await page.clock.runFor(SETTLE_MS);
		}

		const counters = await gpuMemory(page, "settled");
		// With ambient occlusion the number of live programs differs between
		// runs (by 4 on this machine) while every byte figure is the same.
		// Programs are budgeted in `facade`; here they are only printed.
		const programs = counters["settled.three.programs"];
		delete counters["settled.three.programs"];
		const heap = await jsHeap(page);
		const figures = {
			programs,
			gpuMB: megabytes(counters["settled.gpu.totalBytes"]),
			heapMB: megabytes(heap.usedBytes),
			backingStorageMB: megabytes(heap.backingStorageBytes),
		};
		console.log(`${variant.id}: ${JSON.stringify(figures)}`);
		test.info().annotations.push({
			type: "memory",
			description: `${variant.id}: ${JSON.stringify(figures)}`,
		});

		if (UPDATE) {
			writeBaseline(variant.id, counters);
			return;
		}
		expect(compare(variant.id, counters).join("\n")).toBe("");
	});
}
