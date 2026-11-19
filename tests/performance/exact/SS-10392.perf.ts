import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

test("SS-10392 the beauty blend renders 16 frames across 1500ms", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"the beauty blend is the soft-shadow fade, off on SwiftShader",
	);
	test.fail(true, "SS-10392 not implemented: remove this line in its PR");
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await open(page);
	await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({
			shadows: true,
			softShadows: true,
			beautyDelay: 50,
			beautyDuration: 1500,
		});
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#8899aa",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
	});
	await page.clock.runFor(50);
	await page.evaluate(() => {
		(window as any).__perf.renders.length = 0;
	});
	await page.clock.runFor(1500);
	const frames = await page.evaluate(() => {
		const times = new Set(
			(window as any).__perf.renders
				.filter((pass: any) => pass.target === null)
				.map((pass: any) => pass.time),
		);
		return times.size;
	});
	expect(frames).toBe(16);
});
