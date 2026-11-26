import {expect, test} from "@playwright/test";
import * as THREE from "three";
import {
	drawSetRevision,
	renderInScope,
	SD_DATA_TYPE,
	SDObject,
	setBatchHidden,
} from "../../rendering-engine/rendering-engine-threejs/src/objects/SDObject";

/**
 * The render-list cut of an SDObject (SS-10606): `visible` reads the value
 * written last outside a render, and inside a render that cuts it is false
 * as well for a branch that holds nothing three.js draws on its own.
 */

/** scene > root > branch0..1 > leaf0..1 > mesh, like the converted tree. */
function tree() {
	const scene = new THREE.Scene();
	const root = new SDObject("root", "1");
	scene.add(root);
	const branches: SDObject[] = [];
	const leaves: SDObject[][] = [];
	const meshes: THREE.Mesh[][] = [];
	for (let i = 0; i < 2; i++) {
		const branch = new SDObject(`b${i}`, "1");
		root.add(branch);
		branches.push(branch);
		leaves.push([]);
		meshes.push([]);
		for (let j = 0; j < 2; j++) {
			const leaf = new SDObject(`l${i}${j}`, "1");
			branch.add(leaf);
			leaves[i].push(leaf);
			const mesh = new THREE.Mesh();
			leaf.add(mesh);
			meshes[i].push(mesh);
		}
	}
	return {scene, root, branches, leaves, meshes};
}

/** `visible` of each object as three.js reads it inside a render. */
function inRender(objects: THREE.Object3D[], cut = true): boolean[] {
	return renderInScope(cut, () => objects.map((o) => o.visible));
}

/** `SDwalkNeeded` recounted from scratch, to check the incremental one. */
function recount(object: SDObject): number {
	let count = 0;
	for (const child of object.children) {
		if (child instanceof SDObject) {
			const needed = recount(child);
			if (child.SDvisibleState && (needed > 0 || child.SDalwaysWalk))
				count++;
		} else if (!(child as {_SDbatchHidden?: boolean})._SDbatchHidden)
			count++;
	}
	expect(object.SDwalkNeeded).toBe(count);
	return count;
}

test("a branch of plain meshes is walked", () => {
	const {root, branches} = tree();
	recount(root);
	expect(root.SDwalkNeeded).toBe(2);
	expect(inRender([root, ...branches])).toEqual([true, true, true]);
});

test("a fully batched branch is cut inside a render only", () => {
	const {root, branches, leaves, meshes} = tree();
	for (const mesh of meshes.flat()) setBatchHidden(mesh, true);
	recount(root);
	expect(root.SDwalkNeeded).toBe(0);
	// Outside a render the mirror of the node's visibility holds.
	expect([root, ...branches, ...leaves.flat()].map((o) => o.visible)).toEqual(
		Array(7).fill(true),
	);
	expect(inRender([root, branches[0], leaves[0][0]])).toEqual([
		false,
		false,
		false,
	]);
	// A render that does not cut, and the time after a render.
	expect(inRender([root], false)).toEqual([true]);
	expect(root.visible).toBe(true);
	expect(meshes[0][0].visible).toBe(false);
});

test("a member that leaves its batch lifts the cut on its ancestors", () => {
	const {root, branches, leaves, meshes} = tree();
	for (const mesh of meshes.flat()) setBatchHidden(mesh, true);
	setBatchHidden(meshes[1][0], false);
	recount(root);
	expect(meshes[1][0].visible).toBe(true);
	expect(inRender([root, branches[0], branches[1], leaves[1][0]])).toEqual([
		true,
		false,
		true,
		true,
	]);
	// Back to the batch: the cut comes back.
	setBatchHidden(meshes[1][0], true);
	recount(root);
	expect(inRender([root])).toEqual([false]);
});

test("adds, removes, hidden nodes and SDalwaysWalk keep the counts", () => {
	const {root, branches, leaves, meshes} = tree();
	for (const mesh of meshes.flat()) setBatchHidden(mesh, true);

	// A plain object an API user adds is walked.
	const extra = new THREE.Object3D();
	leaves[0][1].add(extra);
	recount(root);
	expect(inRender([root, branches[0], branches[1]])).toEqual([
		true,
		true,
		false,
	]);
	extra.removeFromParent();
	recount(root);
	expect(inRender([root])).toEqual([false]);

	// A hidden node counts 0, also when its meshes are drawn on their own.
	setBatchHidden(meshes[0][0], false);
	branches[0].visible = false;
	recount(root);
	expect(inRender([root])).toEqual([false]);
	branches[0].visible = true;
	recount(root);
	expect(inRender([root])).toEqual([true]);
	setBatchHidden(meshes[0][0], true);

	// A light node is always walked.
	leaves[1][1].SDalwaysWalk = true;
	recount(root);
	expect(inRender([root, branches[1], leaves[1][1]])).toEqual([
		true,
		true,
		true,
	]);
	leaves[1][1].SDalwaysWalk = false;
	recount(root);

	// Moving a member to another parent, with attach, clear and a removal.
	branches[1].attach(meshes[0][1]);
	recount(root);
	leaves[0][0].clear();
	recount(root);
	const mesh = new THREE.Mesh();
	branches[0].add(mesh);
	recount(root);
	expect(inRender([branches[0]])).toEqual([true]);
	root.remove(branches[0]);
	recount(root);
	expect(inRender([root])).toEqual([false]);
	root.add(branches[0]);
	recount(root);
	expect(inRender([root])).toEqual([true]);
});

test("placeholders count 0, a placeholder with children counts 1", () => {
	const root = new SDObject("root", "1");
	const instanced = new THREE.Object3D();
	instanced.userData.isInstanced = true;
	root.add(instanced);
	const anchor = new THREE.Object3D();
	anchor.userData.SDtype = SD_DATA_TYPE.HTML_ELEMENT_ANCHOR;
	root.add(anchor);
	expect(root.SDwalkNeeded).toBe(0);
	root.remove(instanced);
	instanced.add(new THREE.Mesh());
	root.add(instanced);
	expect(root.SDwalkNeeded).toBe(1);
});

test("the render scope closes when a render throws", () => {
	const {root, meshes} = tree();
	for (const mesh of meshes.flat()) setBatchHidden(mesh, true);
	expect(() =>
		renderInScope(true, () => {
			throw new Error("shader compile failed");
		}),
	).toThrow("shader compile failed");
	expect(root.visible).toBe(true);
});

test("a cut that flips moves the drawSet channel", () => {
	const {meshes} = tree();
	const before = drawSetRevision();
	for (const mesh of meshes.flat()) setBatchHidden(mesh, true);
	expect(drawSetRevision()).toBeGreaterThan(before);
	const after = drawSetRevision();
	// Hiding a mesh that is hidden already changes nothing.
	setBatchHidden(meshes[0][0], true);
	expect(drawSetRevision()).toBe(after);
});

test("copy and clone see the real visibility", () => {
	const {root, meshes} = tree();
	for (const mesh of meshes.flat()) setBatchHidden(mesh, true);
	const clone = root.clone();
	expect(clone.visible).toBe(true);
	root.visible = false;
	expect(new SDObject("c", "1").copy(root, false).visible).toBe(false);
});
