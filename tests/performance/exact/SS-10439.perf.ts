import {expect} from "@playwright/test";
import {installBranches, open, test} from "./harness";

test("SS-10439 node objects do not recompute their matrices on render", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		perf.branches();
		const scene = perf.viewport.threeJsCoreObjects.scene;

		// the objects of the scene tree nodes, root included
		const nodeObjects = new Set<any>();
		SDV.sceneTree.root.traverse((node: any) => {
			const object = node.convertedObject[perf.viewport.id];
			if (object) nodeObjects.add(object);
		});
		let autoNodeObjects = 0;
		nodeObjects.forEach((object) => {
			if (object.matrixAutoUpdate) autoNodeObjects++;
		});
		let objects = 0;
		let autoObjects = 0;
		scene.traverse((object: any) => {
			objects++;
			if (object.matrixAutoUpdate) autoObjects++;
		});

		// The matrix world update that every renderer.render call runs.
		// Count the matrices it composes for node objects.
		const object3D = Object.getPrototypeOf(scene.constructor.prototype);
		const original = object3D.updateMatrix;
		let count = 0;
		object3D.updateMatrix = function (this: any) {
			if (nodeObjects.has(this)) count++;
			return original.call(this);
		};
		try {
			scene.updateMatrixWorld();
			const composed = count;
			// control: the same pass with matrixAutoUpdate on, as before
			nodeObjects.forEach((object) => (object.matrixAutoUpdate = true));
			count = 0;
			scene.updateMatrixWorld();
			return {
				objects,
				autoObjects,
				nodeObjects: nodeObjects.size,
				autoNodeObjects,
				composed,
				composedWithAutoUpdate: count,
			};
		} finally {
			object3D.updateMatrix = original;
			nodeObjects.forEach((object) => (object.matrixAutoUpdate = false));
		}
	});
	console.log("SS-10439 static scene", JSON.stringify(result));
	// The scene root and the 73 nodes of the test tree, plus the nodes the
	// viewport adds (lights).
	expect(result.nodeObjects).toBeGreaterThanOrEqual(74);
	expect(result.autoNodeObjects).toBe(0);
	expect(result.composed).toBe(0);
	expect(result.composedWithAutoUpdate).toBe(result.nodeObjects);
});

test("SS-10439 a node transformation reaches its descendants", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const branch = tree.branches[5];
		const leaf = tree.leaves[5][3];
		const leafObject = leaf.convertedObject[perf.viewport.id];
		perf.viewport.render();
		const before = leafObject.matrixWorld.elements[12];

		// The drag path: a transformation and a transformation-only update.
		branch.addTransformation(tree.shift(100));
		perf.viewport.updateNodeTransformation(branch);
		perf.viewport.render();
		const dragged = {
			branch: branch.convertedObject[perf.viewport.id].matrixWorld
				.elements[12],
			leafObject: leafObject.matrixWorld.elements[12],
			drawn: tree.worldX(leaf),
		};

		// A scene update after the drag keeps the position.
		branch.updateVersion(true, false);
		perf.viewport.update();
		perf.viewport.render();
		const updated = leafObject.matrixWorld.elements[12];
		return {before, dragged, updated};
	});
	expect(result.before).toBeCloseTo(0, 4);
	expect(result.dragged.branch).toBeCloseTo(100, 4);
	expect(result.dragged.leafObject).toBeCloseTo(100, 4);
	expect(result.dragged.drawn).toBeCloseTo(100, 4);
	expect(result.updated).toBeCloseTo(100, 4);
});

test("SS-10439 an animation moves the node object and its descendants", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installBranches);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const tree = perf.branches();
		const branch = tree.branches[6];
		const leafObject = tree.leaves[6][2].convertedObject[perf.viewport.id];
		const data = new SDV.AnimationData(
			"move",
			[
				{
					times: [0, 0.3],
					node: branch,
					values: [0, 0, 0, 25, 0, 0],
					path: "translation",
					interpolation: "linear",
				},
			],
			0,
			0.3,
		);
		data.reset = false;
		branch.data.push(data);
		data.startAnimation();
		perf.viewport.update();
		await new Promise((resolve) => setTimeout(resolve, 900));
		const branchObject = branch.convertedObject[perf.viewport.id];
		return {
			autoUpdate: branchObject.matrixAutoUpdate,
			branch: branchObject.matrixWorld.elements[12],
			leafObject: leafObject.matrixWorld.elements[12],
			drawn: tree.worldX(tree.leaves[6][2]),
			unmoved:
				tree.leaves[1][2].convertedObject[perf.viewport.id].matrixWorld
					.elements[12],
		};
	});
	expect(result.autoUpdate).toBe(false);
	expect(result.branch).toBeCloseTo(25, 3);
	expect(result.leafObject).toBeCloseTo(25, 3);
	expect(result.drawn).toBeCloseTo(25, 3);
	expect(result.unmoved).toBeCloseTo(0, 4);
});
