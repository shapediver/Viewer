import {expect} from "@playwright/test";
import {open, test} from "./harness";

// The glTF specification defaults `doubleSided` to false. The Viewer
// deliberately treats an omitted value as double-sided (SS-10388 rejected).
test("SS-10388 rejected: an omitted side stays double-sided", async ({
	page,
}) => {
	await open(page);
	const sides = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const created = new SDV.MaterialStandardData({});
		const explicit = new SDV.MaterialStandardData({
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		await perf.create({shadows: false});
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		const indices = new Uint16Array([0, 1, 2]);
		const bytes = new Uint8Array(44);
		bytes.set(new Uint8Array(positions.buffer), 0);
		bytes.set(new Uint8Array(indices.buffer), 36);
		let binary = "";
		for (let i = 0; i < bytes.length; i++)
			binary += String.fromCharCode(bytes[i]);
		const primitive = (material: number) => ({
			primitives: [{attributes: {POSITION: 0}, indices: 1, material}],
		});
		const gltf = {
			asset: {version: "2.0"},
			scene: 0,
			scenes: [{nodes: [0, 1, 2]}],
			nodes: [
				{name: "omitted", mesh: 0},
				{name: "doubled", mesh: 1, translation: [2, 0, 0]},
				{name: "single", mesh: 2, translation: [4, 0, 0]},
			],
			meshes: [primitive(0), primitive(1), primitive(2)],
			materials: [
				{pbrMetallicRoughness: {baseColorFactor: [1, 0, 0, 1]}},
				{
					doubleSided: true,
					pbrMetallicRoughness: {baseColorFactor: [0, 1, 0, 1]},
				},
				{
					doubleSided: false,
					pbrMetallicRoughness: {baseColorFactor: [0, 0, 1, 1]},
				},
			],
			accessors: [
				{
					bufferView: 0,
					componentType: 5126,
					count: 3,
					type: "VEC3",
					min: [0, 0, 0],
					max: [1, 1, 0],
				},
				{bufferView: 1, componentType: 5123, count: 3, type: "SCALAR"},
			],
			bufferViews: [
				{buffer: 0, byteOffset: 0, byteLength: 36},
				{buffer: 0, byteOffset: 36, byteLength: 6},
			],
			buffers: [
				{
					uri: `data:application/octet-stream;base64,${btoa(binary)}`,
					byteLength: bytes.length,
				},
			],
		};
		const blob = new Blob([JSON.stringify(gltf)], {
			type: "model/gltf+json",
		});
		const href = URL.createObjectURL(blob);
		const node = await SDV.DataEngine.instance.loadContent({
			format: "gltf",
			href,
		});
		SDV.sceneTree.addNode(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const found: {omitted?: number; doubled?: number; single?: number} = {};
		SDV.sceneTree.root.traverse((treeNode: any) => {
			const converted = treeNode.convertedObject[perf.viewport.id];
			converted?.traverse?.((object: any) => {
				if (!object.isMesh) return;
				if (treeNode.name === "omitted")
					found.omitted = object.material.side;
				if (treeNode.name === "doubled")
					found.doubled = object.material.side;
				if (treeNode.name === "single")
					found.single = object.material.side;
			});
		});
		return {
			created: created.side,
			explicit: explicit.side,
			double: SDV.MATERIAL_SIDE.DOUBLE,
			rendered: found,
		};
	});
	const context = JSON.stringify(sides);
	// MaterialStandardData default and an explicit DOUBLE
	expect(sides.created, context).toBe(sides.double);
	expect(sides.explicit, context).toBe(sides.double);
	// THREE.DoubleSide is 2, THREE.FrontSide is 0
	expect(sides.rendered.omitted, context).toBe(2);
	expect(sides.rendered.doubled, context).toBe(2);
	expect(sides.rendered.single, context).toBe(0);
});
