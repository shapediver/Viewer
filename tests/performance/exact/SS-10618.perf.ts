import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10618: the first frame draws the scene with programs the pre-compile
 * built, also with post-processing.
 *
 * With effects the composer draws the scene into a render target: three.js
 * then uses other programs (linear output, no tone mapping) than for a draw
 * onto the canvas. The pre-compile has to build those, or the first frame
 * links its scene programs itself.
 *
 * `watch` records the programs that exist when the first frame starts to
 * draw. After the frame, every scene material must use one of them.
 */
function installWatch() {
	const perf = (window as any).__perf;
	perf.watch = () => {
		const renderer = perf.renderer;
		const scene = perf.viewport.threeJsCoreObjects.scene;
		const log = {before: null as Set<unknown> | null};
		const render = renderer.render.bind(renderer);
		renderer.render = (target: any, camera: any) => {
			if (!log.before && target === scene)
				log.before = new Set<unknown>(renderer.info.programs ?? []);
			return render(target, camera);
		};
		return {
			/** Scene materials drawn with a program the frame created. */
			result() {
				const before = log.before;
				const materials = new Set<any>();
				scene.traverse((object: any) => {
					if (!object.isMesh || !object.visible) return;
					(Array.isArray(object.material)
						? object.material
						: [object.material]
					).forEach((m: any) => m && materials.add(m));
				});
				const linkedInFrame: string[] = [];
				let drawn = 0;
				for (const material of materials) {
					const program =
						renderer.properties.get(material).currentProgram;
					if (!program) continue;
					drawn++;
					if (!before || !before.has(program))
						linkedInFrame.push(material.type);
				}
				return {drawn, linkedInFrame, framed: Boolean(before)};
			},
		};
	};
}

async function run(page: any, effect: "none" | "before" | "after") {
	await open(page);
	await page.evaluate(installWatch);
	return page.evaluate(async (when: string) => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const watch = perf.watch();
		const addSsao = () =>
			perf.viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
			});
		if (when === "before") addSsao();
		perf.addBoxes(
			20,
			new SDV.MaterialStandardData({
				color: "#cccccc",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#88bbdd",
				opacity: 0.5,
				alphaMode: SDV.MATERIAL_ALPHA.BLEND,
				side: SDV.MATERIAL_SIDE.DOUBLE,
			}),
		);
		perf.viewport.update();
		// The session settings can add effects after the scene update.
		if (when === "after") addSsao();
		perf.viewport.show = true;
		await perf.nextFrame();
		return watch.result();
	}, effect);
}

for (const effect of ["before", "after"] as const)
	test(`SS-10618 with an effect added ${effect} the scene update, the first frame links no scene program`, async ({
		page,
	}) => {
		const result = await run(page, effect);
		expect(result.framed, JSON.stringify(result)).toBe(true);
		expect(result.drawn, JSON.stringify(result)).toBeGreaterThan(0);
		expect(result.linkedInFrame, JSON.stringify(result)).toEqual([]);
	});

test("SS-10618 without post-processing, the first frame links no scene program", async ({
	page,
}) => {
	const result = await run(page, "none");
	expect(result.framed, JSON.stringify(result)).toBe(true);
	expect(result.drawn, JSON.stringify(result)).toBeGreaterThan(0);
	expect(result.linkedInFrame, JSON.stringify(result)).toEqual([]);
});
