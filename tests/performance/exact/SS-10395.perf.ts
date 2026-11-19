import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10395 a default standard material is MeshStandardMaterial", async ({
	page,
}) => {
	await open(page);
	const types = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const plain = new SDV.MaterialStandardData({
			color: "#777777",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const coated = new SDV.MaterialStandardData({
			color: "#777777",
			side: SDV.MATERIAL_SIDE.FRONT,
			clearcoat: 0.5,
		});
		const plainGeometry = perf.boxGeometry([-0.5, -0.5, 0], [0.5, 0.5, 1]);
		plainGeometry.material = plain;
		const coatedGeometry = perf.boxGeometry([-0.5, -0.5, 2], [0.5, 0.5, 3]);
		coatedGeometry.material = coated;
		const plainNode = new SDV.TreeNode("plain");
		plainNode.addData(plainGeometry);
		const coatedNode = new SDV.TreeNode("coated");
		coatedNode.addData(coatedGeometry);
		SDV.sceneTree.root.addChild(plainNode);
		SDV.sceneTree.root.addChild(coatedNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const typeOf = (node: any) => {
			let found = "";
			const converted = node.convertedObject[perf.viewport.id];
			converted?.traverse?.((object: any) => {
				if (object.isMesh) found = object.material.type;
			});
			return found;
		};
		return {plain: typeOf(plainNode), coated: typeOf(coatedNode)};
	});
	expect(types.plain).toBe("MeshStandardMaterial");
	expect(types.coated).toBe("MeshPhysicalMaterial");
});
