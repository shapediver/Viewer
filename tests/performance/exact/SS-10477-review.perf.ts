import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * Claims of an independent review of the SS-10477 batch update, each tested
 * on its own. Counts and object state only. Software-safe, shadows are off.
 */

/** Runs in the page. Adds `window.__r`. */
function installReviewTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;

	/** Triangles of the last frame drawn to the canvas. */
	function lastCanvasTriangles() {
		const passes = perf.renders.filter((item: any) => item.target === null);
		return passes[passes.length - 1]?.triangles ?? null;
	}

	function material(roughness = 0.4, color = "#66cc88") {
		return new SDV.MaterialStandardData({
			color,
			roughness,
			side: SDV.MATERIAL_SIDE.FRONT,
		});
	}

	function addBoxNode(
		name: string,
		index: number,
		mat: any,
		parent = SDV.sceneTree.root,
	) {
		const geometry = perf.boxGeometry(
			[0, index * 1.2, 0],
			[0.8, index * 1.2 + 0.8, 0.8],
		);
		geometry.material = mat;
		const node = new SDV.TreeNode(name);
		node.addData(geometry);
		parent.addChild(node);
		return node;
	}

	(window as any).__r = {lastCanvasTriangles, material, addBoxNode};
}

test("SS-10477 review 1: shared geometry survives renderer type switches", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installReviewTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const r = (window as any).__r;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		// One geometry data on four nodes, drawn from one batch.
		const geometry = perf.boxGeometry([0, 0, 0], [0.8, 0.8, 0.8]);
		geometry.material = r.material();
		for (let i = 0; i < 4; i++) {
			const node = new SDV.TreeNode(`shared${i}`);
			node.addData(geometry);
			node.addTransformation({
				id: "move",
				matrix: new Float32Array([
					1,
					0,
					0,
					0,
					0,
					1,
					0,
					0,
					0,
					0,
					1,
					0,
					0,
					i * 1.2,
					0,
					1,
				]),
			});
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const triangles = [r.lastCanvasTriangles()];
		for (const type of [
			SDV.RENDERER_TYPE.ATTRIBUTES,
			SDV.RENDERER_TYPE.STANDARD,
			SDV.RENDERER_TYPE.ATTRIBUTES,
			SDV.RENDERER_TYPE.STANDARD,
		]) {
			perf.viewport.type = type;
			perf.viewport.update();
			perf.renders.length = 0;
			await perf.nextFrame();
			triangles.push(r.lastCanvasTriangles());
		}
		return triangles;
	});

	// Four boxes of 12 triangles, every time.
	expect(result).toEqual([48, 48, 48, 48, 48]);
});

test("SS-10477 review 2: an outlined batched node stays selected after a colour change", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installReviewTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const r = (window as any).__r;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const mat = r.material();
		const nodes = [0, 1, 2, 3].map((i) => r.addBoxNode(`box${i}`, i, mat));
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const token = perf.viewport.postProcessing.addEffect({
			type: SDV.POST_PROCESSING_EFFECT_TYPE.OUTLINE,
		});
		const manager = perf.viewport.postProcessing.outlineEffects[token];
		manager.addSelection(nodes[1]);
		await perf.nextFrame();
		const meshOf = () => nodes[1].data[0].convertedObject[perf.viewport.id];
		const oldMesh = meshOf();
		const before = manager._outlineEffect.selection.has(oldMesh);

		// A colour-only change of the material, as an app does on a click.
		nodes[1].data[0].material = r.material(0.4, "#cc3322");
		nodes[1].data[0].updateVersion();
		nodes[1].updateVersion();
		perf.viewport.update();
		await perf.nextFrame();
		return {
			before,
			after: manager._outlineEffect.selection.has(meshOf()),
			meshChanged: meshOf() !== oldMesh,
			oldStillSelected: manager._outlineEffect.selection.has(oldMesh),
		};
	});

	expect(result.meshChanged, "the viewer made a new mesh").toBe(true);
	expect(result.before).toBe(true);
	expect(result.after, "the outline holds the current mesh").toBe(true);
});

test("SS-10477 review 3: world matrices are current after update()", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installReviewTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const r = (window as any).__r;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const mat = r.material();
		const group = new SDV.TreeNode("group");
		const boxes = [0, 1, 2].map((i) =>
			r.addBoxNode(`b${i}`, i, mat, group),
		);
		// A line in a child node: not a mesh, not a batch member.
		const positions = new Float32Array([0, 0, 0, 1, 0, 0]);
		const line = new SDV.GeometryData(
			new SDV.PrimitiveData({
				POSITION: new SDV.AttributeData(
					positions,
					3,
					12,
					0,
					2,
					false,
					positions.length,
				),
			}),
			SDV.PRIMITIVE_MODE.LINES,
		);
		line.material = new SDV.MaterialBasicLineData({color: "#ffffff"});
		const lineNode = new SDV.TreeNode("line", group);
		lineNode.addData(line);
		SDV.sceneTree.root.addChild(group);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();

		// Move the group, then read the matrices before any frame.
		group.addTransformation({
			id: "move",
			matrix: new Float32Array([
				1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 7, 0, 0, 1,
			]),
		});
		group.updateVersion();
		perf.viewport.update();
		const x = (object: any) => object.matrixWorld.elements[12];
		const lineObject = lineNode.data[0].convertedObject[perf.viewport.id];
		return {
			group: x(group.convertedObject[perf.viewport.id]),
			lineNode: x(lineNode.convertedObject[perf.viewport.id]),
			line: x(lineObject),
			box: x(boxes[0].data[0].convertedObject[perf.viewport.id]),
		};
	});

	expect(result).toEqual({group: 7, lineNode: 7, line: 7, box: 7});
});

test("SS-10477 review 5: a geometry written in place marks the batch for a new draw list", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installReviewTools);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const r = (window as any).__r;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const mat = r.material();
		const nodes = [0, 1, 2, 3].map((i) => r.addBoxNode(`box${i}`, i, mat));
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
		const mesh = nodes[1].data[0].convertedObject[perf.viewport.id];
		const batch = mesh.userData.batchedMesh;
		// Watch the draw-list flag and the visibility writes of the member.
		batch._visibilityChanged = false;
		const original = batch.setVisibleAt.bind(batch);
		let visibleWrites = 0;
		batch.setVisibleAt = (...args: any[]) => {
			visibleWrites++;
			return original(...args);
		};
		nodes[1].data[0].updateVersion();
		nodes[1].updateVersion();
		perf.viewport.update();
		return {
			sameBatch:
				nodes[1].data[0].convertedObject[perf.viewport.id].userData
					.batchedMesh === batch,
			flag: batch._visibilityChanged,
			visibleWrites,
		};
	});

	expect(result.sameBatch).toBe(true);
	expect(result.flag).toBe(true);
});
