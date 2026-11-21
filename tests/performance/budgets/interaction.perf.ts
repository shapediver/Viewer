import {expect, test, type Page} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {installPicking} from "../fixtures/counters/picking";
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
 * With `glassBlend` the panes are batched. Then it also moves the pointer
 * over three empty points (`hoverMiss`): a ray that hits no pane must not
 * read the bounds of the batch.
 */
async function collectInteraction(
	page: Page,
	id: string,
	glassBlend: boolean,
): Promise<Counters> {
	await createScene(
		page,
		{id, shadows: false, ssao: false},
		{...INTERACTION_SCENE, glassBlend},
	);
	await page.evaluate(() => (window as any).__probe.setupInteraction());
	await page.evaluate(installPicking);
	await settle(page);
	await page.evaluate(() =>
		(window as any).__probe.counters.picking.attach(),
	);

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
	await pickingCounters(page, "hover", counters);

	// A hover that stays on a pane must not keep the loop busy.
	await page.mouse.move(...points[0]);
	await page.clock.runFor(SETTLE_MS);
	counters["hover.idleRenderCalls"] = await idleRenderCalls(page);
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	if (glassBlend) {
		const empty: [number, number][] = [
			corner,
			[box.x + box.width - 2, box.y + 2],
			[box.x + box.width / 2, box.y + 2],
		];
		Object.assign(
			counters,
			await measure(page, "hoverMiss", async () => {
				for (const point of empty) {
					await page.mouse.move(...point);
					await page.clock.runFor(64);
				}
			}),
		);
		await pickingCounters(page, "hoverMiss", counters);
		await page.mouse.move(...corner);
		await page.clock.runFor(SETTLE_MS);
	}

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
	await pickingCounters(page, "select", counters);
	counters["select.idleRenderCalls"] = await idleRenderCalls(page);

	await finalStats(page, counters);
	return counters;
}

/** What the last `measure` picked for, from the `picking` counter. */
async function pickingCounters(page: Page, prefix: string, counters: Counters) {
	const picking = await page.evaluate(() =>
		(window as any).__probe.counters.picking.read(),
	);
	counters[`${prefix}.picks`] = picking.picks;
	counters[`${prefix}.hiddenSourceRaycasts`] = picking.hiddenSourceRaycasts;
	counters[`${prefix}.batchRaycasts`] = picking.batchRaycasts;
	counters[`${prefix}.batchBoundsReads`] = picking.batchBoundsReads;
}

test("budget: AEC facade, interaction", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page);
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectInteraction(page, "interaction", false);
	if (UPDATE) {
		writeBaseline("interaction", counters);
		return;
	}
	// SS-10393: a pick tests the nodes its ray can hit, not all 384.
	expect(counters["hover.raycastCalls"]).toBeLessThanOrEqual(80);
	expect(counters["select.raycastCalls"]).toBeLessThanOrEqual(240);
	expect(compare("interaction", counters).join("\n")).toBe("");
});

test("budget: AEC facade, interactionBlendedGlass", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page);
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectInteraction(
		page,
		"interactionBlendedGlass",
		true,
	);
	if (UPDATE) {
		writeBaseline("interactionBlendedGlass", counters);
		return;
	}
	// SS-10393: batched panes are tested through the batch, not through
	// their hidden source meshes, and only when the ray can hit one.
	expect(counters["hover.hiddenSourceRaycasts"]).toBe(0);
	expect(counters["hoverMiss.batchBoundsReads"]).toBe(0);
	expect(counters["hover.batchRaycasts"]).toBeLessThanOrEqual(
		counters["hover.picks"],
	);
	expect(compare("interactionBlendedGlass", counters).join("\n")).toBe("");
});
