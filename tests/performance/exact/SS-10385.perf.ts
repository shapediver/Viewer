import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

test("SS-10385 blending 0 returns before the PCSS kernel", async ({page}) => {
	await skipOnSoftwareRenderer(
		page,
		"needs soft shadows, which are off on SwiftShader",
	);
	await open(page);
	const source = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: true, softShadows: true});
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#dddddd",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const gl = perf.gl;
		const programs = perf.renderer.info.programs ?? [];
		const sources = programs.map(
			(program: any) => gl.getShaderSource(program.fragmentShader) ?? "",
		);
		return (
			sources.find((item: string) => item.includes("getPCSSShadow")) ?? ""
		);
	});
	expect(source.length).toBeGreaterThan(0);
	const guard = source.search(
		/if\s*\(\s*blending\s*==\s*0\.0\s*\)\s*return\s+pcfShadow\s*;/,
	);
	const call = source.lastIndexOf("getPCSSShadow(");
	expect(guard).toBeGreaterThan(-1);
	expect(guard).toBeLessThan(call);
});
