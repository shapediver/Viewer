import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

test("SS-10383 hidden contact shadow does not render the scene", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"shadows are off on SwiftShader and the test asserts a hardware renderer",
	);
	test.fail(true, "SS-10383 not implemented: remove this line in its PR");
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const gpu = await perf.create({
			shadows: true,
			softShadows: false,
			contactShadow: false,
		});
		const material = new SDV.MaterialStandardData({
			color: "#cccccc",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(8, material);
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await perf.nextFrame();
		const passes = perf.renders.map((pass: any) => ({
			calls: pass.calls,
			triangles: pass.triangles,
			meshes: pass.meshes,
			depthMeshes: pass.depthMeshes,
			target: pass.target,
		}));
		return {
			gpu,
			contact: passes.filter((pass: any) => pass.depthMeshes >= 8).length,
			color: passes.some(
				(pass: any) => pass.target === null && pass.triangles === 96,
			),
			passes,
		};
	});
	expect(result.gpu.toLowerCase(), result.gpu).not.toContain("swiftshader");
	expect(result.color, JSON.stringify(result.passes)).toBe(true);
	expect(result.contact, JSON.stringify(result.passes)).toBe(0);
});
