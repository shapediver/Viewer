import * as THREE from "three";
import {
	type INodeBoundsEntry,
	NodeBoundsHierarchy,
} from "../src/implementation/NodeBoundsHierarchy";

/**
 * The hierarchy reads only `id`, `parent` and `convertedObject` of a tree
 * node and `id` and `convertedObject` of a geometry data, so plain objects
 * stand in for them.
 */
const VIEWPORT = "viewport";

interface IFakeNode {
	id: string;
	parent?: IFakeNode;
	convertedObject: {[viewportId: string]: THREE.Object3D | undefined};
}

let nextId = 0;

function fakeNode(object?: THREE.Object3D, parent?: IFakeNode): IFakeNode {
	return {
		id: `node${nextId++}`,
		parent,
		convertedObject: {[VIEWPORT]: object},
	};
}

function fakeData(converted?: THREE.Object3D) {
	return {id: `data${nextId++}`, convertedObject: {[VIEWPORT]: converted}};
}

function entry(
	node: IFakeNode,
	data: ReturnType<typeof fakeData>[] = [],
): INodeBoundsEntry {
	const geometryData: {[key: string]: unknown} = {};
	for (const d of data) geometryData[`${d.id}_0`] = d;
	return {node, geometryData} as unknown as INodeBoundsEntry;
}

function rayAlongZ(x: number, y: number): THREE.Ray {
	return new THREE.Ray(
		new THREE.Vector3(x, y, -100),
		new THREE.Vector3(0, 0, 1),
	);
}

function stats() {
	const value = {
		queries: 0,
		objectsChecked: 0,
		rebuilds: 0,
		nodesTested: 0,
		instancesChecked: 0,
	};
	(globalThis as {__nodeBoundsStats?: unknown}).__nodeBoundsStats = value;
	return value;
}

afterEach(() => {
	delete (globalThis as {__nodeBoundsStats?: unknown}).__nodeBoundsStats;
});

const box = () => new THREE.BoxGeometry(1, 1, 1);

/** A group with a mesh at x. */
function meshAt(x: number): THREE.Group {
	const group = new THREE.Group();
	const mesh = new THREE.Mesh(box(), new THREE.MeshBasicMaterial());
	mesh.position.set(x, 0, 0);
	group.add(mesh);
	group.updateMatrixWorld(true);
	return group;
}

describe("NodeBoundsHierarchy: meshes", () => {
	test("only the entries whose box the ray hits, ascending, with the always entries merged", () => {
		const sprite = new THREE.Group();
		sprite.add(new THREE.Sprite());
		const entries = [
			entry(fakeNode(meshAt(0))),
			entry(fakeNode(sprite)),
			entry(fakeNode(meshAt(5))),
			entry(fakeNode(meshAt(0))),
		];
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		const thresholds = {line: 1, points: 1};
		expect(hierarchy.candidates(rayAlongZ(0, 0), thresholds)).toEqual([
			0, 1, 3,
		]);
		expect(hierarchy.candidates(rayAlongZ(5, 0), thresholds)).toEqual([
			1, 2,
		]);
		expect(hierarchy.candidates(rayAlongZ(20, 0), thresholds)).toEqual([1]);
	});
});

describe("NodeBoundsHierarchy: lines and points", () => {
	/** A line along x from 0 to 1 at y = z = 0, below a scaled group. */
	function lineGroup(scale: number) {
		const group = new THREE.Group();
		group.scale.setScalar(scale);
		const geometry = new THREE.BufferGeometry().setAttribute(
			"position",
			new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3),
		);
		const line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
		group.add(line);
		group.updateMatrixWorld(true);
		return {group, line};
	}

	function pointsGroup(scale: number) {
		const group = new THREE.Group();
		group.scale.setScalar(scale);
		const geometry = new THREE.BufferGeometry().setAttribute(
			"position",
			new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3),
		);
		const points = new THREE.Points(geometry, new THREE.PointsMaterial());
		group.add(points);
		group.updateMatrixWorld(true);
		return {group, points};
	}

	test("a line is bounded: a ray closer than the threshold is a candidate, a farther one is not", () => {
		const {group} = lineGroup(1);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes([entry(fakeNode(group))]);
		expect(
			hierarchy.candidates(rayAlongZ(0.5, 0.5), {line: 1, points: 1}),
		).toEqual([0]);
		expect(
			hierarchy.candidates(rayAlongZ(0.5, 0.5), {line: 0.1, points: 1}),
		).toEqual([]);
		// The points threshold does not widen a line.
		expect(
			hierarchy.candidates(rayAlongZ(0.5, 0.5), {line: 0.1, points: 10}),
		).toEqual([]);
		// Without thresholds the line is a candidate for every ray.
		expect(hierarchy.candidates(rayAlongZ(50, 50))).toEqual([0]);
	});

	test("points are bounded and widened by the points threshold", () => {
		const {group} = pointsGroup(1);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes([entry(fakeNode(group))]);
		expect(
			hierarchy.candidates(rayAlongZ(0, 0.5), {line: 0, points: 1}),
		).toEqual([0]);
		expect(
			hierarchy.candidates(rayAlongZ(0, 0.5), {line: 10, points: 0.1}),
		).toEqual([]);
	});

	test("every ray that three.js finds a line or points hit for is a candidate", () => {
		const raycaster = new THREE.Raycaster();
		let seed = 7;
		const random = () => {
			seed = (seed * 16807) % 2147483647;
			return seed / 2147483647;
		};
		for (const scale of [0.5, 1, 3]) {
			const line = lineGroup(scale);
			const points = pointsGroup(scale);
			const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
			hierarchy.setNodes([
				entry(fakeNode(line.group)),
				entry(fakeNode(points.group)),
			]);
			for (let i = 0; i < 400; i++) {
				const threshold = random() * 2;
				raycaster.params.Line = {threshold};
				raycaster.params.Points = {threshold};
				const origin = new THREE.Vector3(
					random() * 10 - 5,
					random() * 10 - 5,
					random() * 10 - 5,
				);
				const target = new THREE.Vector3(
					random() * 4 - 1,
					random() * 4 - 2,
					random() * 4 - 2,
				);
				raycaster.set(origin, target.sub(origin).normalize());
				const candidates = hierarchy.candidates(raycaster.ray, {
					line: threshold,
					points: threshold,
				});
				if (raycaster.intersectObject(line.line).length > 0)
					expect(candidates).toContain(0);
				if (raycaster.intersectObject(points.points).length > 0)
					expect(candidates).toContain(1);
			}
		}
	});
});

describe("NodeBoundsHierarchy: instances", () => {
	/**
	 * An instanced mesh of `count` unit boxes at x = 0, 2, 4, ... below a
	 * root, as the instance group manager keeps it: one slot per
	 * occurrence, named `${node.id}:${geometry.id}`.
	 */
	function instancedScene(count: number) {
		const root = new THREE.Group();
		const data = fakeData();
		const mesh = new THREE.InstancedMesh(
			box(),
			new THREE.MeshBasicMaterial(),
			count + 4,
		);
		mesh.userData.instanceHash = "hash";
		mesh.userData.instanceNodes = [];
		mesh.userData.instanceKeys = [];
		root.add(mesh);
		data.convertedObject[VIEWPORT] = mesh;
		const nodes: IFakeNode[] = [];
		const entries: INodeBoundsEntry[] = [];
		for (let i = 0; i < count; i++) {
			// The node of an instance has a group with a placeholder.
			const group = new THREE.Group();
			group.add(new THREE.Object3D());
			const node = fakeNode(group);
			nodes.push(node);
			entries.push(entry(node, [data]));
			mesh.setMatrixAt(
				i,
				new THREE.Matrix4().makeTranslation(i * 2, 0, 0),
			);
			mesh.userData.instanceNodes[i] = node;
			mesh.userData.instanceKeys[i] = `${node.id}:${data.id}`;
		}
		mesh.count = count;
		mesh.instanceMatrix.needsUpdate = true;
		root.updateMatrixWorld(true);
		return {root, mesh, data, nodes, entries};
	}

	test("an instance is a candidate only where the ray hits it, with its slot", () => {
		const counters = stats();
		const {mesh, entries} = instancedScene(50);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		const thresholds = {line: 1, points: 1};
		expect(hierarchy.candidates(rayAlongZ(6, 0), thresholds)).toEqual([3]);
		expect(hierarchy.instanceSlots(3)).toEqual([
			expect.objectContaining({mesh, slot: 3}),
		]);
		expect(hierarchy.candidates(rayAlongZ(-5, 0), thresholds)).toEqual([]);
		expect(hierarchy.candidates(rayAlongZ(98, 0), thresholds)).toEqual([
			49,
		]);
		// Nothing changed between the queries: no instance was compared again.
		counters.instancesChecked = 0;
		counters.objectsChecked = 0;
		hierarchy.candidates(rayAlongZ(6, 0), thresholds);
		expect(counters.instancesChecked).toBe(0);
		expect(counters.objectsChecked).toBe(0);
		expect(counters.nodesTested).toBe(3);
	});

	test("a moved instance is found at its new place", () => {
		const {mesh, entries} = instancedScene(10);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		const thresholds = {line: 1, points: 1};
		expect(hierarchy.candidates(rayAlongZ(4, 0), thresholds)).toEqual([2]);
		mesh.setMatrixAt(2, new THREE.Matrix4().makeTranslation(4, 10, 0));
		mesh.instanceMatrix.needsUpdate = true;
		expect(hierarchy.candidates(rayAlongZ(4, 0), thresholds)).toEqual([]);
		expect(hierarchy.candidates(rayAlongZ(4, 10), thresholds)).toEqual([2]);
	});

	test("an instance that moves to another mesh (a highlight) keeps its box and gets its new slot", () => {
		const counters = stats();
		const {root, mesh, entries, nodes, data} = instancedScene(10);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		const thresholds = {line: 1, points: 1};
		hierarchy.candidates(rayAlongZ(4, 0), thresholds);

		// Move occurrence 2 to an effect mesh, the last slot into its place.
		const effect = new THREE.InstancedMesh(
			mesh.geometry,
			new THREE.MeshBasicMaterial(),
			4,
		);
		effect.userData.instanceHash = "hash";
		effect.userData.instanceNodes = [nodes[2]];
		effect.userData.instanceKeys = [`${nodes[2].id}:${data.id}`];
		effect.setMatrixAt(0, new THREE.Matrix4().makeTranslation(4, 0, 0));
		effect.count = 1;
		root.add(effect);
		const last = new THREE.Matrix4();
		mesh.getMatrixAt(9, last);
		mesh.setMatrixAt(2, last);
		mesh.userData.instanceNodes[2] = nodes[9];
		mesh.userData.instanceKeys[2] = `${nodes[9].id}:${data.id}`;
		mesh.userData.instanceNodes[9] = undefined;
		mesh.userData.instanceKeys[9] = undefined;
		mesh.count = 9;
		mesh.instanceMatrix.needsUpdate = true;

		expect(hierarchy.candidates(rayAlongZ(4, 0), thresholds)).toEqual([2]);
		expect(hierarchy.instanceSlots(2)).toEqual([
			expect.objectContaining({mesh: effect, slot: 0}),
		]);
		expect(hierarchy.candidates(rayAlongZ(18, 0), thresholds)).toEqual([9]);
		expect(hierarchy.instanceSlots(9)).toEqual([
			expect.objectContaining({mesh, slot: 2}),
		]);
		// The slots of the changed meshes were compared, no object.
		expect(counters.instancesChecked).toBeGreaterThan(0);
		expect(counters.objectsChecked).toBe(0);
	});

	test("an instance of a descendant node is a candidate of the ancestor that holds its geometry data", () => {
		const {nodes, entries, data} = instancedScene(4);
		const parent = fakeNode(new THREE.Group());
		nodes[1].parent = parent;
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		// The interaction feature lists a node with the geometry data of
		// the nodes below it.
		hierarchy.setNodes([...entries, entry(parent, [data])]);
		expect(
			hierarchy.candidates(rayAlongZ(2, 0), {line: 1, points: 1}),
		).toEqual([1, 4]);
		expect(hierarchy.instanceSlots(4)).toEqual([
			expect.objectContaining({slot: 1}),
		]);
	});

	test("an instanced mesh whose slots do not name their nodes is tested whole", () => {
		const {mesh, entries} = instancedScene(5);
		delete mesh.userData.instanceKeys;
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes(entries);
		expect(
			hierarchy.candidates(rayAlongZ(100, 100), {line: 1, points: 1}),
		).toEqual([0, 1, 2, 3, 4]);
		expect(hierarchy.instanceSlots(0)).toBeUndefined();
	});
});

describe("NodeBoundsHierarchy: review cases", () => {
	test("a node with instances and a mesh below it notices that the mesh moved", () => {
		// The interaction feature lists a node with the geometry data of the
		// nodes below it: here one that converts to an instanced mesh.
		const root = new THREE.Group();
		const instanced = new THREE.InstancedMesh(
			box(),
			new THREE.MeshBasicMaterial(),
			1,
		);
		instanced.userData.instanceHash = "hash";
		instanced.userData.instanceNodes = [];
		instanced.userData.instanceKeys = [];
		instanced.count = 0;
		root.add(instanced);
		const data = fakeData(instanced);
		const group = meshAt(0);
		const node = fakeNode(group);
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes([entry(node, [data])]);
		const thresholds = {line: 1, points: 1};
		expect(hierarchy.candidates(rayAlongZ(0, 0), thresholds)).toEqual([0]);
		// The mesh is moved without any event.
		group.children[0].position.set(10, 0, 0);
		group.updateMatrixWorld(true);
		expect(hierarchy.candidates(rayAlongZ(10, 0), thresholds)).toEqual([0]);
		expect(hierarchy.candidates(rayAlongZ(0, 0), thresholds)).toEqual([]);
	});

	test("a line whose positions changed after its box was computed is bounded by its vertices", () => {
		const group = new THREE.Group();
		const geometry = new THREE.BufferGeometry().setAttribute(
			"position",
			new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3),
		);
		geometry.computeBoundingBox();
		const line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
		group.add(line);
		group.updateMatrixWorld(true);
		// The box of the geometry stays as it was: three.js's raycast of a
		// line does not read it.
		const position = geometry.attributes.position as THREE.BufferAttribute;
		position.setXYZ(1, 20, 0, 0);
		position.needsUpdate = true;
		const hierarchy = new NodeBoundsHierarchy(VIEWPORT);
		hierarchy.setNodes([entry(fakeNode(group))]);
		const thresholds = {line: 0.5, points: 0.5};
		const raycaster = new THREE.Raycaster(
			new THREE.Vector3(15, 0, -100),
			new THREE.Vector3(0, 0, 1),
		);
		raycaster.params.Line = {threshold: 0.5};
		expect(raycaster.intersectObject(line).length).toBeGreaterThan(0);
		expect(hierarchy.candidates(raycaster.ray, thresholds)).toEqual([0]);
	});
});
