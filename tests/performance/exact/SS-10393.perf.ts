import {expect, type Page} from "@playwright/test";
import {open, test} from "./harness";

const raytrace = async (page: Page) => {
	await open(page);
	return page.evaluate(async () => {
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
};

// Regression test for picking: it passes today and must keep passing.
test("SS-10393 a ray hits the known triangle", async ({page}) => {
	const hit = await raytrace(page);
	expect(hit.count).toBe(1);
	expect(hit.distance).toBeCloseTo(1, 4);
});

// The SS-10393 review rescoped the ticket to a bounds hierarchy first, with a
// triangle BVH only for large meshes. A check on the three-mesh-bvh property
// `geometry.boundsTree` may therefore never be the right acceptance: SS-10393
// must rewrite or delete this test.
test("SS-10393 the hit geometry has a bounds tree", async ({page}) => {
	test.fail(true, "SS-10393 not implemented: rewrite or delete in its PR");
	const hit = await raytrace(page);
	expect(hit.boundsTree).toBe(true);
});
