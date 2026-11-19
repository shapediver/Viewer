import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10516: switching a string attribute on a model without sdTF overview
 * data must not throw, and every item must get its look.
 *
 * Software-safe: no pixels, no timing and no shadows. It checks the material
 * the attribute visualization assigns to each item, so it runs the same on
 * SwiftShader and on a hardware GPU. It does not need a hardware GPU.
 */
test("SS-10516 a string attribute without overview data gives every item a look", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await open(page);

	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const SDVAV = (window as any).SDVAttributeVisualization;
		await perf.create();
		perf.addBoxes(
			6,
			new SDV.MaterialStandardData({
				color: "#8899aa",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		// Item data only. There is deliberately no SDTFOverviewData.
		// The root has other children besides the boxes.
		const boxes = SDV.sceneTree.root.children.filter((node: any) =>
			node.name.startsWith("box"),
		);
		boxes.forEach((node: any, index: number) => {
			node.addData(
				new SDV.SDTFItemData("string", `item${index}`, {
					zone: {typeHint: "string", value: `zone${index % 3}`},
				}),
			);
		});
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;

		const engine = new SDVAV.AttributeVisualizationEngine(perf.viewport);
		engine.updateAttributes([
			{
				key: "zone",
				type: SDV.SDTF_TYPEHINT.STRING,
				visualization: SDVAV.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED,
			},
		]);
		// The engine applies the update in a microtask. Wait for it, then
		// for a frame.
		await Promise.resolve();
		await perf.nextFrame();

		const colors = boxes.map((node: any) => {
			const geometry = node.data.find((d: any) => d.attributeMaterial);
			return geometry
				? JSON.stringify(geometry.attributeMaterial.color)
				: null;
		});
		return {colors, black: JSON.stringify(engine.defaultMaterial.color)};
	});

	expect(errors).toEqual([]);
	expect(result.colors).toHaveLength(6);
	// Every item has a look, and it is not the default one.
	for (const color of result.colors) {
		expect(color).not.toBeNull();
		expect(color).not.toBe(result.black);
	}
});
