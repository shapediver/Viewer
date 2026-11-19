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
	Object.assign(
		counters,
		await measure(page, "attributes.plain", () => orbitStep(page)),
	);

	await page.evaluate(() => (window as any).__probe.setupAttributes());
	await page.clock.runFor(SETTLE_MS);
	const step = (prefix: string, key: string | null) =>
		measure(page, `attributes.${prefix}`, async () => {
			await page.evaluate(
				(k) => (window as any).__probe.showAttribute(k),
				key,
			);
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
	);
	Object.assign(
		counters,
		await measure(page, "attributes.afterLeave", () => orbitStep(page)),
	);
	counters["attributes.idleRenderCalls"] = await idleRenderCalls(page);

	await finalStats(page, counters);
	return counters;
}

test("budget: AEC facade, attributes", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page);
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectAttributes(page);
	if (UPDATE) {
		writeBaseline("attributes", counters);
		return;
	}
	expect(compare("attributes", counters).join("\n")).toBe("");
});
