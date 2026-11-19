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
	settle,
	SETTLE_MS,
	UPDATE,
	writeBaseline,
} from "./harness";

// 20 floors took 144 s on an integrated GPU, over the 120 s default timeout.
// 6 floors take ~56 s. The counters scale with the pane count, so a smaller
// tower still shows a batch rebuild on hover.
const INTERACTION_SCENE = {...AEC_DEFAULT, floors: 6};

/**
 * Hover and select on 1160 meshes. Looks for screen points that hit a glass
 * pane, sweeps the pointer over them, clicks them, and counts the cost.
 */
async function collectInteraction(page: Page): Promise<Counters> {
	await createScene(
		page,
		{id: "interaction", shadows: false, ssao: false},
		INTERACTION_SCENE,
	);
	await page.evaluate(() => (window as any).__probe.setupInteraction());
	await settle(page);

	const box = await page.evaluate(() => (window as any).__probe.canvasRect());
	const corner: [number, number] = [box.x + 2, box.y + 2];
	const points: [number, number][] = [];
	for (let row = 1; row <= 10 && points.length < 3; row++)
		for (let column = 1; column <= 12 && points.length < 3; column++) {
			const x = box.x + (box.width * column) / 13;
			const y = box.y + (box.height * row) / 11;
			await page.evaluate(() => (window as any).__probe.reset());
			await page.mouse.move(x, y);
			await page.clock.runFor(32);
			const picks = await page.evaluate(() =>
				(window as any).__probe.picks(),
			);
			if (picks.events.hoverOn > 0) points.push([x, y]);
		}
	expect(points.length, "no pane was hit by the hover scan").toBe(3);
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	const counters: Counters = {};
	// The first pass creates the effect materials. Count the second one.
	for (const point of points) {
		await page.mouse.move(...point);
		await page.clock.runFor(64);
	}
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	Object.assign(
		counters,
		await measure(page, "hover", async () => {
			for (const point of points) {
				await page.mouse.move(...point);
				await page.clock.runFor(64);
			}
			await page.mouse.move(...corner);
		}),
	);
	counters["hover.events"] = await page.evaluate(() => {
		const events = (window as any).__probe.picks().events;
		return (events.hoverOn ?? 0) * 100 + (events.hoverOff ?? 0);
	});

	// A hover that stays on a pane must not keep the loop busy.
	await page.mouse.move(...points[0]);
	await page.clock.runFor(SETTLE_MS);
	counters["hover.idleRenderCalls"] = await idleRenderCalls(page);
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	const click = async (point: [number, number]) => {
		await page.mouse.move(...point);
		await page.clock.runFor(32);
		await page.mouse.down();
		await page.clock.runFor(16);
		await page.mouse.up();
		await page.clock.runFor(64);
	};
	// Warm up the select effect once, then measure select and deselect.
	for (const point of points) await click(point);
	await click(corner);
	await page.clock.runFor(SETTLE_MS);
	Object.assign(
		counters,
		await measure(page, "select", async () => {
			for (const point of points) await click(point);
			await click(corner);
		}),
	);
	counters["select.events"] = await page.evaluate(() => {
		const events = (window as any).__probe.picks().events;
		return (events.selectOn ?? 0) * 100 + (events.selectOff ?? 0);
	});
	counters["select.idleRenderCalls"] = await idleRenderCalls(page);

	await finalStats(page, counters);
	return counters;
}

test("budget: AEC facade, interaction", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page);
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectInteraction(page);
	if (UPDATE) {
		writeBaseline("interaction", counters);
		return;
	}
	expect(compare("interaction", counters).join("\n")).toBe("");
});
