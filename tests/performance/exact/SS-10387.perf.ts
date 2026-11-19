import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10387 camera start and beauty activation do not dirty materials", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({
			shadows: true,
			softShadows: true,
			beautyDelay: 0,
			beautyDuration: 80,
		});
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#99aabb",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
		await new Promise<void>((resolve) => {
			SDV.addListener(
				SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
				() => resolve(),
			);
		});
		let flips = 0;
		const seen = new Set<any>();
		const trap = (material: any) => {
			if (!material || seen.has(material)) return;
			seen.add(material);
			let value = material.needsUpdate;
			Object.defineProperty(material, "needsUpdate", {
				configurable: true,
				get: () => value,
				set: (next: boolean) => {
					if (next === true && value !== true) flips++;
					value = next;
				},
			});
		};
		const root = SDV.sceneTree.root;
		root.traverse((node: any) => {
			const converted = node.convertedObject[perf.viewport.id];
			converted?.traverse?.((object: any) => {
				const materials = Array.isArray(object.material)
					? object.material
					: [object.material];
				materials.forEach(trap);
			});
		});
		(window as any).__perfFlips = () => flips;
		(window as any).__beauty = () =>
			new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					() => resolve(),
				);
			});
	});
	const before = await page.evaluate(() => (window as any).__perfFlips());
	const finished = page.evaluate(() => (window as any).__beauty());
	await page.mouse.move(200, 200);
	await page.mouse.down();
	await page.mouse.move(280, 240);
	await page.mouse.up();
	await finished;
	const afterGesture = await page.evaluate(() =>
		(window as any).__perfFlips(),
	);
	expect(afterGesture - before).toBe(0);
	const afterShadow = await page.evaluate(() => {
		const beforeToggle = (window as any).__perfFlips();
		(window as any).__perf.viewport.shadows = false;
		return (window as any).__perfFlips() - beforeToggle;
	});
	expect(afterShadow).toBeGreaterThan(0);
});
