import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10391 reused primitives share one position buffer", async ({page}) => {
	await open(page);
	const shared = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const first = perf.boxGeometry([-0.5, -0.5, 0], [0.5, 0.5, 1]);
		const material = new SDV.MaterialStandardData({
			color: "#888888",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		first.material = material;
		// Same primitive id, so the geometry cache is hit for the second use.
		const second = new SDV.GeometryData(
			first.primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		second.material = material;
		for (const geometry of [first, second]) {
			const node = new SDV.TreeNode(
				geometry === first ? "first" : "second",
			);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const buffers: any[] = [];
		for (const geometry of [first, second]) {
			const mesh = geometry.convertedObject[perf.viewport.id];
			const attribute = mesh?.geometry?.attributes?.position;
			if (attribute) buffers.push(attribute.array.buffer);
		}
		return {meshes: buffers.length, buffers: new Set(buffers).size};
	});
	expect(shared.meshes).toBe(2);
	expect(shared.buffers).toBe(1);
});

test("SS-10391 removing one mesh keeps the shared geometry", async ({page}) => {
	await open(page);
	const shared = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const first = perf.boxGeometry([-0.5, -0.5, 0], [0.5, 0.5, 1]);
		const material = new SDV.MaterialStandardData({
			color: "#888888",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		first.material = material;
		const second = new SDV.GeometryData(
			first.primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		second.material = material;
		const firstNode = new SDV.TreeNode("first");
		firstNode.addData(first);
		const secondNode = new SDV.TreeNode("second");
		secondNode.addData(second);
		SDV.sceneTree.root.addChild(firstNode);
		SDV.sceneTree.root.addChild(secondNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const kept = second.convertedObject[perf.viewport.id];
		const buffer = kept?.geometry?.attributes?.position?.array?.buffer;
		SDV.sceneTree.root.removeChild(firstNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const after = second.convertedObject[perf.viewport.id];
		const position = after?.geometry?.attributes?.position;
		return {
			alive: position?.array?.buffer === buffer,
			count: position?.count ?? 0,
		};
	});
	expect(shared.alive).toBe(true);
	expect(shared.count).toBeGreaterThan(0);
});

test("SS-10391 a triangle strip clones before rewriting the index", async ({
	page,
}) => {
	await open(page);
	const shared = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([
			0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
		]);
		const indices = new Uint16Array([0, 1, 2, 3]);
		const primitive = new SDV.PrimitiveData(
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
			new SDV.AttributeData(indices, 1, 2, 0, 2, false, indices.length),
		);
		const material = new SDV.MaterialStandardData({
			color: "#888888",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const triangles = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		triangles.material = material;
		const strip = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLE_STRIP,
		);
		strip.material = material;
		for (const geometry of [triangles, strip]) {
			const node = new SDV.TreeNode(
				geometry === triangles ? "triangles" : "strip",
			);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const triangleMesh = triangles.convertedObject[perf.viewport.id];
		const stripMesh = strip.convertedObject[perf.viewport.id];
		return {
			triangleIndex: triangleMesh?.geometry?.getIndex()?.count ?? 0,
			stripIndex: stripMesh?.geometry?.getIndex()?.count ?? 0,
			sameGeometry: triangleMesh?.geometry === stripMesh?.geometry,
		};
	});
	expect(shared.triangleIndex).toBe(4);
	expect(shared.stripIndex).toBe(6);
	expect(shared.sameGeometry).toBe(false);
});

test("SS-10391 gems that share a primitive keep the tight sphere", async ({
	page,
}) => {
	await open(page);
	const gems = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([
			0, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0,
			0.5, 0.5, 1,
		]);
		const indices = new Uint16Array([
			4, 0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 5, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0,
			3,
		]);
		const primitive = new SDV.PrimitiveData(
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
			new SDV.AttributeData(indices, 1, 2, 0, 2, false, indices.length),
		);
		const firstMaterial = new SDV.MaterialGemData({color: "#88ccff"});
		const secondMaterial = new SDV.MaterialGemData({color: "#88ccff"});
		const first = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		first.material = firstMaterial;
		const second = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		second.material = secondMaterial;
		for (const geometry of [first, second]) {
			const node = new SDV.TreeNode(
				geometry === first ? "gem-a" : "gem-b",
			);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const mesh = first.convertedObject[perf.viewport.id];
		return {
			first: firstMaterial.radius,
			second: secondMaterial.radius,
			shared: mesh?.geometry?.boundingSphere?.radius ?? null,
		};
	});
	expect(gems.first).toBeCloseTo(gems.second, 5);
	expect(gems.shared).not.toBeNull();
	expect(gems.first).toBeLessThan((gems.shared as number) - 0.05);
});
