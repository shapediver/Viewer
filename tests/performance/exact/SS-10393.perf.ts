import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10393 a ray hits the known triangle through a BVH", async ({page}) => {
	await open(page);
	const hit = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		const indices = new Uint16Array([0, 1, 2]);
		const geometry = new SDV.GeometryData(
			new SDV.PrimitiveData(
				{
					POSITION: new SDV.AttributeData(
						positions,
						3,
						12,
						0,
						4,
						false,
						positions.length,
					),
				},
				new SDV.AttributeData(
					indices,
					1,
					2,
					0,
					2,
					false,
					indices.length,
				),
			),
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		geometry.material = new SDV.MaterialUnlitData({color: "#00ff00"});
		const node = new SDV.TreeNode("triangle");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const hits = perf.viewport.raytraceScene([0.2, 0.2, 1], [0, 0, -1]);
		let boundsTree = false;
		const converted = node.convertedObject[perf.viewport.id];
		converted?.traverse?.((object: any) => {
			if (object.isMesh && object.geometry?.boundsTree) boundsTree = true;
		});
		return {
			count: hits.length,
			distance: hits[0]?.distance ?? null,
			boundsTree,
		};
	});
	expect(hit.count).toBe(1);
	expect(hit.distance).toBeCloseTo(1, 4);
	expect(hit.boundsTree).toBe(true);
});
