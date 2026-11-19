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
	UPDATE,
	writeBaseline,
} from "./harness";

/**
 * The facade with blended glass (`alphaMode: BLEND`, no depth write), the
 * way glTF exports it. three.js draws each transparent double-sided pane
 * twice and dirties its material twice per draw.
 */
async function collectBlendedGlass(page: Page): Promise<Counters> {
	await createScene(
		page,
		{id: "blendedGlass", shadows: false, ssao: false},
		{...AEC_DEFAULT, glassBlend: true},
	);
	await settle(page);
	const counters: Counters = {};
	Object.assign(
		counters,
		await measure(page, "blendedGlass", () => orbitStep(page)),
	);
	counters["blendedGlass.batchBoundsReads"] = await page.evaluate(() =>
		(window as any).__probe.batchBoundsReads(),
	);
	counters["blendedGlass.idleRenderCalls"] = await idleRenderCalls(page);
	await finalStats(page, counters);
	return counters;
}

test("budget: AEC facade, blendedGlass", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page);
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectBlendedGlass(page);
	if (UPDATE) {
		writeBaseline("blendedGlass", counters);
		return;
	}
	expect(compare("blendedGlass", counters).join("\n")).toBe("");
});
