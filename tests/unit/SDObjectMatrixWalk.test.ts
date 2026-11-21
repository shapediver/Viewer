import {expect, test} from "@playwright/test";
import * as THREE from "three";
import {SDObject} from "../../rendering-engine/rendering-engine-threejs/src/objects/SDObject";

/**
 * The matrix walk of an SDObject (SS-10485): a branch that did not change is
 * left out, everything that can have moved is still reached.
 */

/** Counts the calls of `Object3D.updateMatrixWorld` that do the walk. */
function countWalks() {
	const proto = THREE.Object3D.prototype;
	const original = proto.updateMatrixWorld;
	const walked = new Set<THREE.Object3D>();
	proto.updateMatrixWorld = function (this: THREE.Object3D, force?: boolean) {
		walked.add(this);
		return original.call(this, force);
	};
	return {
		walked,
		restore() {
			proto.updateMatrixWorld = original;
		},
	};
}

/** scene > root > branch0..2 > leaf0..2 > mesh, like the converted tree. */
function tree() {
	const scene = new THREE.Scene();
	const root = new SDObject("root", "1");
	root.matrixAutoUpdate = false;
	scene.add(root);
	const branches: SDObject[] = [];
	const leaves: SDObject[][] = [];
	const meshes: THREE.Object3D[][] = [];
	for (let i = 0; i < 3; i++) {
		const branch = new SDObject(`b${i}`, "1");
		branch.matrixAutoUpdate = false;
		root.add(branch);
		branches.push(branch);
		leaves.push([]);
		meshes.push([]);
		for (let j = 0; j < 3; j++) {
			const leaf = new SDObject(`b${i}l${j}`, "1");
			leaf.matrixAutoUpdate = false;
			branch.add(leaf);
			const mesh = new THREE.Object3D();
			mesh.matrixAutoUpdate = false;
			leaf.add(mesh);
			leaves[i].push(leaf);
			meshes[i].push(mesh);
		}
	}
	scene.updateMatrixWorld();
	return {scene, root, branches, leaves, meshes};
}

const names = (walked: Set<THREE.Object3D>) =>
	[...walked]
		.filter((o) => o instanceof SDObject)
		.map((o) => (o as SDObject).SDid);

function withCounter<T>(run: (counter: ReturnType<typeof countWalks>) => T): T {
	const counter = countWalks();
	try {
		return run(counter);
	} finally {
		counter.restore();
	}
}

test("a scene walk leaves out every branch that did not change", () => {
	const {scene} = tree();
	withCounter((counter) => {
		scene.updateMatrixWorld();
		// The scene itself, nothing of the tree.
		expect(names(counter.walked)).toEqual([]);
	});
});

test("a changed leaf is walked with the way to it, nothing else", () => {
	const {scene, leaves, meshes} = tree();
	leaves[1][2].matrix.makeTranslation(5, 0, 0);
	leaves[1][2].matrixWorldNeedsUpdate = true;
	withCounter((counter) => {
		scene.updateMatrixWorld();
		expect(names(counter.walked).sort()).toEqual(["b1", "b1l2", "root"]);
	});
	expect(meshes[1][2].matrixWorld.elements[12]).toBeCloseTo(5);
	expect(meshes[1][1].matrixWorld.elements[12]).toBeCloseTo(0);
	// and the mark is gone afterwards
	withCounter((counter) => {
		scene.updateMatrixWorld();
		expect(names(counter.walked)).toEqual([]);
	});
});

test("a changed branch recomputes everything below it", () => {
	const {scene, branches, leaves, meshes} = tree();
	branches[0].matrix.makeTranslation(0, 7, 0);
	branches[0].matrixWorldNeedsUpdate = true;
	scene.updateMatrixWorld();
	for (let j = 0; j < 3; j++) {
		expect(leaves[0][j].matrixWorld.elements[13]).toBeCloseTo(7);
		expect(meshes[0][j].matrixWorld.elements[13]).toBeCloseTo(7);
		expect(meshes[2][j].matrixWorld.elements[13]).toBeCloseTo(0);
	}
});

test("applyTransformation marks the way to the object", () => {
	const {scene, leaves, meshes} = tree();
	leaves[2][0].applyTransformation([
		1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1,
	] as never);
	scene.updateMatrixWorld();
	expect(meshes[2][0].matrixWorld.elements[12]).toBeCloseTo(3);
});

test("an added object is walked, with an automatic and a fixed matrix", () => {
	const {scene, leaves} = tree();
	leaves[0][1].matrix.makeTranslation(2, 0, 0);
	leaves[0][1].matrixWorldNeedsUpdate = true;
	scene.updateMatrixWorld();

	const auto = new THREE.Object3D();
	auto.position.set(0, 4, 0);
	const fixed = new THREE.Object3D();
	fixed.matrixAutoUpdate = false;
	fixed.matrix.makeTranslation(0, 0, 6);
	leaves[0][1].add(auto);
	leaves[0][1].add(fixed);
	scene.updateMatrixWorld();
	expect(auto.matrixWorld.elements[12]).toBeCloseTo(2);
	expect(auto.matrixWorld.elements[13]).toBeCloseTo(4);
	expect(fixed.matrixWorld.elements[12]).toBeCloseTo(2);
	expect(fixed.matrixWorld.elements[14]).toBeCloseTo(6);
});

test("a branch that is flagged to be walked follows its automatic children", () => {
	const {scene, branches, leaves} = tree();
	const light = new THREE.Object3D();
	leaves[1][1].add(light);
	scene.updateMatrixWorld();
	// without the flag the branch is left out
	light.position.set(8, 0, 0);
	scene.updateMatrixWorld();
	expect(light.matrixWorld.elements[12]).toBeCloseTo(0);
	for (const object of [leaves[1][1], branches[1], scene.children[0]])
		(object as SDObject).SDalwaysWalk = true;
	scene.updateMatrixWorld();
	expect(light.matrixWorld.elements[12]).toBeCloseTo(8);
});

test("a moved scene moves the tree, a scene that only recomputes does not walk it", () => {
	const {scene, meshes} = tree();
	scene.position.set(10, 0, 0);
	scene.updateMatrixWorld();
	expect(meshes[2][2].matrixWorld.elements[12]).toBeCloseTo(10);
	withCounter((counter) => {
		scene.updateMatrixWorld();
		expect(names(counter.walked)).toEqual([]);
	});
	scene.position.set(0, 0, 0);
	scene.updateMatrixWorld();
	expect(meshes[2][2].matrixWorld.elements[12]).toBeCloseTo(0);
});

test("a mark made while walking survives to the next walk", () => {
	const {scene, leaves, meshes} = tree();
	// An object that marks a branch that was walked before it, like a tool
	// that moves a node while the pass runs.
	const trigger = new THREE.Object3D();
	trigger.matrixAutoUpdate = false;
	trigger.updateMatrixWorld = function () {
		leaves[0][0].matrix.makeTranslation(0, 0, 9);
		leaves[0][0].matrixWorldNeedsUpdate = true;
	};
	leaves[2][0].add(trigger);
	// The first walk reaches the trigger, which marks a branch that this walk
	// has passed already, while the root is being walked.
	scene.updateMatrixWorld();
	expect(meshes[0][0].matrixWorld.elements[14]).toBeCloseTo(0);
	scene.updateMatrixWorld();
	expect(meshes[0][0].matrixWorld.elements[14]).toBeCloseTo(9);
});

test("an object that goes back to the scene is computed again", () => {
	const scene = new THREE.Scene();
	const object = new SDObject("a", "1");
	object.matrixAutoUpdate = false;
	object.matrix.makeTranslation(1, 0, 0);
	scene.add(object);
	scene.updateMatrixWorld();
	const holder = new SDObject("holder", "1");
	holder.matrixAutoUpdate = false;
	holder.matrix.makeTranslation(5, 0, 0);
	scene.add(holder);
	holder.add(object);
	scene.updateMatrixWorld();
	expect(object.matrixWorld.elements[12]).toBeCloseTo(6);
	// The scene matrix is the same as when the object was walked under it
	// before, and the scene is not an SDObject that could mark the object.
	scene.add(object);
	scene.updateMatrixWorld();
	expect(object.matrixWorld.elements[12]).toBeCloseTo(1);
});

test("a node that holds a three.js object forces its plain children, not the tree", () => {
	const {scene, branches, leaves, meshes} = tree();
	const host = leaves[1][1];
	host.SDalwaysWalk = host.SDforceChildren = true;
	for (const object of [branches[1], scene.children[0]])
		(object as SDObject).SDalwaysWalk = true;
	// A fixed object inside, as an API user has it.
	const user = new THREE.Object3D();
	user.matrixAutoUpdate = false;
	host.add(user);
	scene.updateMatrixWorld();
	// A matrix written without a flag, and a child added without one.
	user.matrix.makeTranslation(3, 0, 0);
	const late = new THREE.Object3D();
	late.matrixAutoUpdate = false;
	late.matrix.makeTranslation(0, 4, 0);
	THREE.Object3D.prototype.add.call(user, late);
	withCounter((counter) => {
		scene.updateMatrixWorld();
		// the rest of the tree is not walked
		expect(counter.walked.has(meshes[0][0])).toBe(false);
		expect(counter.walked.has(meshes[2][2])).toBe(false);
	});
	expect(user.matrixWorld.elements[12]).toBeCloseTo(3);
	expect(late.matrixWorld.elements[13]).toBeCloseTo(4);
	expect(late.matrixWorld.elements[12]).toBeCloseTo(3);
});

test("the world matrix property of an SDObject is a plain boolean", () => {
	const object = new SDObject("a", "1");
	expect(object.matrixWorldNeedsUpdate).toBe(false);
	object.matrixWorldNeedsUpdate = true;
	expect(object.matrixWorldNeedsUpdate).toBe(true);
	expect(object.SDmatrixDirty).toBe(true);
	const clone = object.cloneObject();
	expect(clone.matrixWorldNeedsUpdate).toBe(true);
});
