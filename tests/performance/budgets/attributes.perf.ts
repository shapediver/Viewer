import {expect, test, type Page} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {openViewer} from "../fixtures/probe";
import {
	compare,
	Counters,
	createScene,
	finalStats,
	idleRenderCalls,
	isSoftwareRenderer,
	measure,
	orbitStep,
	settle,
	SETTLE_MS,
	UPDATE,
	writeBaseline,
} from "./harness";

// 4 floors took 71 s of the 120 s default timeout, 2 floors take 27 s.
const ATTRIBUTE_SCENE = {...AEC_DEFAULT, floors: 2};

/**
 * Every item gets two sdTF attributes. The test turns the attribute
 * visualization on, switches the attribute, clears it, and leaves the mode.
 */
async function collectAttributes(page: Page): Promise<Counters> {
	// A smaller tower: the visualization takes minutes on the full one (see
	// the counters). Per-mesh counts are comparable, the totals are not.
	await createScene(
		page,
		{id: "attributes", shadows: false, ssao: false},
		ATTRIBUTE_SCENE,
	);
	await settle(page);
	const counters: Counters = {};
	// Reads of tree data are counted from the start, also in the plain step.
	await page.evaluate(() => (window as any).__probe.trackTreeDataReads());
	// What the batches did during a measured step: reconciles and regrowth.
	const batches = async (prefix: string) => {
		const read = await page.evaluate(() =>
			(window as any).__probe.readCounters(),
		);
		return {
			[`attributes.${prefix}.batchRebuilds`]: read.batchRebuild.calls,
			[`attributes.${prefix}.batchBufferGrowths`]:
				read.batchedMesh.bufferGrowths,
		};
	};
	Object.assign(
		counters,
		await measure(page, "attributes.plain", () => orbitStep(page)),
		await batches("plain"),
	);

	await page.evaluate(() => (window as any).__probe.setupAttributes());
	await page.clock.runFor(SETTLE_MS);
	const step = async (prefix: string, key: string | null) => ({
		...(await measure(page, `attributes.${prefix}`, async () => {
			await page.evaluate(
				(k) => (window as any).__probe.showAttribute(k),
				key,
			);
		})),
		...(await batches(prefix)),
	});
	Object.assign(counters, await step("show", "load"));
	// Texture decoding and compiles are real time.
	await page.waitForTimeout(500);
	// The clock is paused. Run the frames the decoded textures queued, so
	// they are not counted in the next step.
	await page.clock.runFor(SETTLE_MS);
	Object.assign(counters, await step("switch", "zone"));
	// No attribute selected. The viewport still renders in attribute mode.
	Object.assign(counters, await step("clear", null));
	// Back to the standard renderer.
	Object.assign(
		counters,
		await measure(page, "attributes.leave", async () => {
			await page.evaluate(() =>
				(window as any).__probe.leaveAttributes(),
			);
		}),
		await batches("leave"),
	);
	Object.assign(
		counters,
		await measure(page, "attributes.afterLeave", () => orbitStep(page)),
		await batches("afterLeave"),
	);
	counters["attributes.idleRenderCalls"] = await idleRenderCalls(page);

	await finalStats(page, counters);
	return counters;
}

test("budget: AEC facade, attributes", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page, "/index.html", {counters: true});
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectAttributes(page);
	if (UPDATE) {
		writeBaseline("attributes", counters);
		return;
	}
	expect(compare("attributes", counters).join("\n")).toBe("");
});
