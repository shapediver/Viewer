import * as THREE from "three";
import {
	type INodeBoundsEntry,
	NodeBoundsHierarchy,
} from "../src/implementation/NodeBoundsHierarchy";
import {
	type IChangeGuard,
	setPickGuards,
} from "../src/implementation/PickGuards";

/**
 * The hierarchy skips its validation while the guards of its viewport say the
 * scene did not change since the last query (SS-10642).
 */
const VIEWPORT = "guarded-viewport";

class FakeGuard implements IChangeGuard {
	public valid = false;
	public built = 0;
	public isValid(): boolean {
		return this.valid;
	}
	public markBuilt(): void {
		this.built++;
		this.valid = true;
	}
	public invalidate(): void {
		this.valid = false;
	}
}

function stats() {
	const value = {
		queries: 0,
		objectsChecked: 0,
		rebuilds: 0,
		nodesTested: 0,
		instancesChecked: 0,
		validationsSkipped: 0,
	};
	(globalThis as {__nodeBoundsStats?: unknown}).__nodeBoundsStats = value;
	return value;
}

function ray(x: number): THREE.Ray {
	return new THREE.Ray(
		new THREE.Vector3(x, 0, -100),
		new THREE.Vector3(0, 0, 1),
	);
}

function scene(count: number) {
	const root = new THREE.Group();
	const meshes: THREE.Mesh[] = [];
	const entries: INodeBoundsEntry[] = [];
	for (let i = 0; i < count; i++) {
		const group = new THREE.Group();
		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshBasicMaterial(),
		);
		mesh.position.set(i * 5, 0, 0);
		group.add(mesh);
		root.add(group);
		meshes.push(mesh);
		const data = {id: `data${i}`, convertedObject: {[VIEWPORT]: mesh}};
		entries.push({
			node: {
				id: `node${i}`,
				convertedObject: {[VIEWPORT]: group},
			},
			geometryData: {[`data${i}_0`]: data},
		} as unknown as INodeBoundsEntry);
	}
	root.updateMatrixWorld(true);
	return {meshes, entries, root};
}

describe("NodeBoundsHierarchy: change guards", () => {
	const bounds = new FakeGuard();
	const instances = new FakeGuard();

	beforeEach(() => {
		bounds.valid = false;
		bounds.built = 0;
		instances.valid = false;
		instances.built = 0;
		setPickGuards(VIEWPORT, {bounds, instances});
	});

	afterEach(() => {
		setPickGuards(VIEWPORT, undefined);
		delete (globalThis as {__nodeBoundsStats?: unknown}).__nodeBoundsStats;
	});

	test("an unchanged scene compares nothing, a changed one is read again", () => {
		const counts = stats();
		const {meshes, entries, root} = scene(20);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);

		expect(hierarchy.candidates(ray(0))).toEqual([0]);
		expect(bounds.built).toBe(1);
		// valid now: no object is compared
		counts.objectsChecked = 0;
		for (let i = 0; i < 5; i++) hierarchy.candidates(ray(0));
		expect(counts.objectsChecked).toBe(0);
		expect(counts.validationsSkipped).toBe(5);

		// a move that the clock reports: invalid, so every object is read
		meshes[0].position.x = 5 * 3;
		root.updateMatrixWorld(true);
		bounds.invalidate();
		instances.invalidate();
		expect(hierarchy.candidates(ray(0))).toEqual([]);
		expect(hierarchy.candidates(ray(15))).toEqual([0, 3]);
		// the group and the mesh of each of the 20 nodes, once
		expect(counts.objectsChecked).toBe(40);
		expect(bounds.built).toBe(2);
		// and nothing again afterwards
		counts.objectsChecked = 0;
		hierarchy.candidates(ray(15));
		expect(counts.objectsChecked).toBe(0);
	});

	test("without the clock's report, an edit is not seen", () => {
		const {meshes, entries, root} = scene(4);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		expect(hierarchy.candidates(ray(0))).toEqual([0]);
		meshes[0].position.x = 100;
		root.updateMatrixWorld(true);
		// the guards still say valid: the old box is used
		expect(hierarchy.candidates(ray(0))).toEqual([0]);
	});

	test("a material change reads the instance slots only", () => {
		const counts = stats();
		const {entries} = scene(10);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		hierarchy.candidates(ray(0));
		counts.objectsChecked = 0;
		instances.invalidate(); // bounds stays valid
		hierarchy.candidates(ray(0));
		expect(counts.objectsChecked).toBe(0);
		expect(instances.built).toBe(2);
		expect(bounds.built).toBe(1);
	});

	test("a new node list is built again", () => {
		const first = scene(3);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(first.entries);
		expect(hierarchy.candidates(ray(0))).toEqual([0]);
		const second = scene(6);
		hierarchy.setNodes(second.entries);
		expect(hierarchy.candidates(ray(25))).toEqual([5]);
	});

	test("without guards every query compares the objects", () => {
		setPickGuards(VIEWPORT, undefined);
		const counts = stats();
		const {entries} = scene(7);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		hierarchy.candidates(ray(0));
		counts.objectsChecked = 0;
		hierarchy.candidates(ray(0));
		expect(counts.objectsChecked).toBe(14);
	});
});
