import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

test("SS-10383 hidden contact shadow does not render the scene", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"shadows are off on SwiftShader and the test asserts a hardware renderer",
	);
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

test("SS-10383 contact shadow reuses one depth material per opacity", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false, contactShadow: true});
		const opaque = new SDV.MaterialStandardData({
			color: "#cccccc",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const glass = new SDV.MaterialStandardData({
			color: "#88bbdd",
			opacity: 0.5,
			alphaMode: SDV.MATERIAL_ALPHA.BLEND,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		for (let i = 0; i < 3; i++) {
			const geometry = perf.boxGeometry(
				[-0.4, -0.4, i * 1.2],
				[0.4, 0.4, i * 1.2 + 0.8],
			);
			geometry.material = i < 2 ? opaque : glass;
			const node = new SDV.TreeNode(`box${i}`);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();

		// Depth materials are never created by the test: count the distinct
		// ones that a render with the contact-shadow camera draws with.
		const seen = new Set<string>();
		let contactRenders = 0;
		const original = perf.renderer.render.bind(perf.renderer);
		perf.renderer.render = (scene: any, camera: any) => {
			if (camera.isOrthographicCamera) contactRenders++;
			scene.traverse((object: any) => {
				const materials = Array.isArray(object.material)
					? object.material
					: [object.material];
				for (const material of materials)
					if (material?.isMeshDepthMaterial) seen.add(material.uuid);
			});
			return original(scene, camera);
		};
		const update = async () => {
			const before = {seen: seen.size, renders: contactRenders};
			perf.viewport.update();
			await perf.nextFrame();
			return {
				created: seen.size - before.seen,
				renders: contactRenders - before.renders,
			};
		};
		const first = await update();
		const second = await update();
		perf.viewport.contactShadowVisibility = false;
		await perf.nextFrame();
		const hidden = await update();
		perf.viewport.contactShadowVisibility = true;
		await perf.nextFrame();
		const shown = await update();
		return {first, second, hidden, shown};
	});
	const json = JSON.stringify(result);
	// distinct opacities in the scene: 1 and 0.5
	expect(result.first.renders, json).toBeGreaterThan(0);
	expect(result.first.created, json).toBeLessThanOrEqual(2);
	expect(result.second.renders, json).toBeGreaterThan(0);
	expect(result.second.created, json).toBe(0);
	expect(result.hidden.created, json).toBe(0);
	expect(result.hidden.renders, json).toBe(0);
	expect(result.shown.renders, json).toBeGreaterThan(0);
});
