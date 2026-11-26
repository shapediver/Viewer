import {SceneNodeChangeKind} from "@shapediver/viewer.shared.types";
import {mat4} from "gl-matrix";
import {
	AbstractTreeNodeData,
	changedChildrenSince,
	currentSerial,
	CustomData,
	ITransformation,
	ITreeNode,
	ITreeNodeData,
	markTreeRead,
	nextSerial,
	Tree,
	TreeNode,
} from "../";

describe("scene graph engine - test", () => {
	let tree: Tree;
	let root: ITreeNode;

	beforeEach(() => {
		tree = Tree.instance;
		root = tree.root;
	});

	// Tree is a singleton, so remove whatever a test added to the root
	afterEach(() => {
		[...root.children].forEach((child) => tree.removeNode(child));
	});

	test("add a child", async () => {
		const name = "test";
		const node = new TreeNode(name);
		tree.addNode(node, root);

		expect(root.children.length).toBe(1);
		expect(root.children[0]!.name).toBe(name);
	});

	test("add multiple children", async () => {
		const name1 = "test1";
		const node1 = new TreeNode(name1);
		const result1 = tree.addNode(node1, root);

		expect(result1).toBe(true);
		expect(root.children.length).toBe(1);
		const child1 = root.children[0];
		expect(child1!.name).toBe(name1);

		const name2 = "test2";
		const node2 = new TreeNode(name2);
		const result2 = tree.addNode(node2, node1);

		expect(result2).toBe(true);
		expect(child1!.children.length).toBe(1);
		const child2 = child1!.children[0];
		expect(child2!.name).toBe(name2);

		const name3 = "test3";
		const node3 = new TreeNode(name3);
		const result3 = tree.addNode(node3, node2);

		expect(result3).toBe(true);
		expect(child2!.children.length).toBe(1);
		const child3 = child2!.children[0];
		expect(child3!.name).toBe(name3);
		expect(child3!.children.length).toBe(0);

		const name4 = "test4";
		const node4 = new TreeNode(name4);
		const result4 = tree.addNode(node4, node2);

		expect(result4).toBe(true);
		expect(child2!.children.length).toBe(2);
		const child4 = child2!.children[1];
		expect(child4!.name).toBe(name4);
		expect(child4!.children.length).toBe(0);
	});

	test("add a child via path", async () => {
		const name = "test";
		const node = new TreeNode(name);
		tree.addNodeAtPath(node, root.getPath());

		expect(root.children.length).toBe(1);
		expect(root.children[0]!.name).toBe(name);
	});

	test("add multiple children via path", async () => {
		const name1 = "test1";
		const node1 = new TreeNode(name1);
		const result1 = tree.addNodeAtPath(node1, root.getPath());

		expect(result1).toBe(true);
		expect(root.children.length).toBe(1);
		const child1 = root.children[0];
		expect(child1!.name).toBe(name1);

		const name2 = "test2";
		const node2 = new TreeNode(name2);
		const result2 = tree.addNodeAtPath(node2, node1.getPath());

		expect(result2).toBe(true);
		expect(child1!.children.length).toBe(1);
		const child2 = child1!.children[0];
		expect(child2!.name).toBe(name2);

		const name3 = "test3";
		const node3 = new TreeNode(name3);
		const result3 = tree.addNodeAtPath(node3, node2.getPath());

		expect(result3).toBe(true);
		expect(child2!.children.length).toBe(1);
		const child3 = child2!.children[0];
		expect(child3!.name).toBe(name3);
		expect(child3!.children.length).toBe(0);

		const name4 = "test4";
		const node4 = new TreeNode(name4);
		const result4 = tree.addNodeAtPath(node4, node2.getPath());

		expect(result4).toBe(true);
		expect(child2!.children.length).toBe(2);
		const child4 = child2!.children[1];
		expect(child4!.name).toBe(name4);
		expect(child4!.children.length).toBe(0);
	});

	test("remove node", async () => {
		const node1 = new TreeNode("n1");
		tree.addNode(node1);
		expect(root.hasChild(node1)).toBe(true);
		tree.removeNode(node1);
		expect(root.hasChild(node1)).toBe(false);
	});

	test("remove multiple nodes", async () => {
		const node1 = new TreeNode("n1");
		const node2 = new TreeNode("n2");
		const node3 = new TreeNode("n3");
		const node4 = new TreeNode("n4");
		const node5 = new TreeNode("n4");
		tree.addNode(node1);
		tree.addNode(node2);
		tree.addNode(node3, node1);
		tree.addNode(node4, node1);
		tree.addNode(node5, node2);

		expect(root.hasChild(node1)).toBe(true);
		expect(root.hasChild(node2)).toBe(true);
		expect(node1.hasChild(node3)).toBe(true);
		expect(node1.hasChild(node4)).toBe(true);
		expect(node2.hasChild(node5)).toBe(true);

		tree.removeNode(node1);
		tree.removeNode(node2);

		expect(root.hasChild(node1)).toBe(false);
		expect(root.hasChild(node2)).toBe(false);
		expect(node1.hasChild(node3)).toBe(true);
		expect(node1.hasChild(node4)).toBe(true);
		expect(node2.hasChild(node5)).toBe(true);

		tree.addNode(node3);

		expect(root.hasChild(node1)).toBe(false);
		expect(root.hasChild(node2)).toBe(false);
		expect(root.hasChild(node3)).toBe(true);
		expect(node1.hasChild(node3)).toBe(false);
		expect(node1.hasChild(node4)).toBe(true);
		expect(node2.hasChild(node5)).toBe(true);
	});

	test("remove node via path", async () => {
		const node1 = new TreeNode("n1");
		tree.addNodeAtPath(node1);
		expect(root.hasChild(node1)).toBe(true);
		tree.removeNodeAtPath(node1.getPath());
		expect(root.hasChild(node1)).toBe(false);
	});

	test("remove multiple nodes via path", async () => {
		const node1 = new TreeNode("n1");
		const node2 = new TreeNode("n2");
		const node3 = new TreeNode("n3");
		const node4 = new TreeNode("n4");
		const node5 = new TreeNode("n4");
		tree.addNodeAtPath(node1);
		tree.addNodeAtPath(node2);
		tree.addNodeAtPath(node3, node1.getPath());
		tree.addNodeAtPath(node4, node1.getPath());
		tree.addNodeAtPath(node5, node2.getPath());

		expect(root.hasChild(node1)).toBe(true);
		expect(root.hasChild(node2)).toBe(true);
		expect(node1.hasChild(node3)).toBe(true);
		expect(node1.hasChild(node4)).toBe(true);
		expect(node2.hasChild(node5)).toBe(true);

		tree.removeNodeAtPath(node1.getPath());
		tree.removeNodeAtPath(node2.getPath());

		expect(root.hasChild(node1)).toBe(false);
		expect(root.hasChild(node2)).toBe(false);
		expect(node1.hasChild(node3)).toBe(true);
		expect(node1.hasChild(node4)).toBe(true);
		expect(node2.hasChild(node5)).toBe(true);

		tree.addNodeAtPath(node3);

		expect(root.hasChild(node1)).toBe(false);
		expect(root.hasChild(node2)).toBe(false);
		expect(root.hasChild(node3)).toBe(true);
		expect(node1.hasChild(node3)).toBe(false);
		expect(node1.hasChild(node4)).toBe(true);
		expect(node2.hasChild(node5)).toBe(true);
	});
});

describe("scene graph node - test", () => {
	beforeEach(() => {});

	test("test creation", async () => {
		const name = "name";
		const data: ITreeNodeData[] = [];
		const transformations: ITransformation[] = [];
		const node = new TreeNode(name, undefined, data, transformations);

		expect(node.name).toBe(name);
		expect(node.data).toStrictEqual(data);
		expect(node.transformations).toBe(transformations);

		const node2 = new TreeNode(name, node, data, transformations);
		expect(node.hasChild(node2)).toBe(true);
	});

	test("adding children", async () => {
		const node = new TreeNode("testRoot");
		node.addChild(new TreeNode("child1"));
		node.addChild(new TreeNode("child2"));
		node.addChild(new TreeNode("child3"));
		node.addChild(new TreeNode("child4"));
		node.addChild(new TreeNode("child5"));

		expect(node.children.length).toBe(5);
	});

	test("having children", async () => {
		const node = new TreeNode("testRoot");
		const child1 = new TreeNode("child1");
		node.addChild(child1);
		const child2 = new TreeNode("child2");
		node.addChild(child2);
		const child3 = new TreeNode("child3");
		node.addChild(child3);
		const child4 = new TreeNode("child4");
		node.addChild(child4);
		const child5 = new TreeNode("child5");
		node.addChild(child5);
		const child6 = new TreeNode("child6");

		expect(node.children.length).toBe(5);

		expect(node.hasChild(child1)).toBe(true);
		expect(node.hasChild(child2)).toBe(true);
		expect(node.hasChild(child3)).toBe(true);
		expect(node.hasChild(child4)).toBe(true);
		expect(node.hasChild(child5)).toBe(true);
		expect(node.hasChild(child6)).toBe(false);
	});

	test("removing children", async () => {
		const node = new TreeNode("testRoot");
		const child1 = new TreeNode("child1");
		node.addChild(child1);
		const child2 = new TreeNode("child2");
		node.addChild(child2);
		const child3 = new TreeNode("child3");
		node.addChild(child3);
		const child4 = new TreeNode("child4");
		node.addChild(child4);
		const child5 = new TreeNode("child5");
		node.addChild(child5);
		const child6 = new TreeNode("child6");

		expect(node.children.length).toBe(5);

		expect(node.hasChild(child1)).toBe(true);
		expect(node.hasChild(child2)).toBe(true);
		expect(node.hasChild(child3)).toBe(true);
		expect(node.hasChild(child4)).toBe(true);
		expect(node.hasChild(child5)).toBe(true);
		expect(node.hasChild(child6)).toBe(false);

		node.removeChild(child1);
		node.removeChild(child2);

		expect(node.children.length).toBe(3);
		expect(node.hasChild(child1)).toBe(false);
		expect(node.hasChild(child2)).toBe(false);
		expect(node.hasChild(child3)).toBe(true);
		expect(node.hasChild(child4)).toBe(true);
		expect(node.hasChild(child5)).toBe(true);
		expect(node.hasChild(child6)).toBe(false);

		node.addChild(child1);

		expect(node.children.length).toBe(4);
		expect(node.hasChild(child1)).toBe(true);
		expect(node.hasChild(child2)).toBe(false);
		expect(node.hasChild(child3)).toBe(true);
		expect(node.hasChild(child4)).toBe(true);
		expect(node.hasChild(child5)).toBe(true);
		expect(node.hasChild(child6)).toBe(false);
	});

	test("test cloning", async () => {
		const name = "name";
		const data: ITreeNodeData[] = [];
		const transformations: ITransformation[] = [];
		const node = new TreeNode(name, undefined, data, transformations);
		const clonedNode = node.clone();
		expect(node.name).toBe(clonedNode.name);
		expect(node.parent).toBe(clonedNode.parent);
		expect(node.data).toStrictEqual(clonedNode.data);
		expect(node.transformations).toStrictEqual(clonedNode.transformations);
		expect(node.version).not.toBe(clonedNode.version);
	});

	test("test cloning children", async () => {
		const name = "name";
		const data: ITreeNodeData[] = [];
		const transformations: ITransformation[] = [];
		const node = new TreeNode(name, undefined, data, transformations);
		node.addChild(new TreeNode("child1"));
		node.addChild(new TreeNode("child2"));
		new TreeNode("child3", node);
		const clonedNode = node.clone();
		expect(node.children.length).toEqual(clonedNode.children.length);
		expect(node.children.length).toEqual(3);
		for (let i = 0; i < node.children.length; i++)
			expect(node.children[i]!.name).toEqual(
				clonedNode.children[i]!.name,
			);
	});

	test("path lookup", async () => {
		const node = new TreeNode("testRoot");
		const child1 = new TreeNode("child1");
		node.addChild(child1);
		const child2 = new TreeNode("child2");
		child1.addChild(child2);
		const child3 = new TreeNode("child3");
		child2.addChild(child3);

		expect(child1.getPath()).toBe(node.getPath() + "." + child1.name);
		expect(child2.getPath()).toBe(
			node.getPath() + "." + child1.name + "." + child2.name,
		);
		expect(child3.getPath()).toBe(
			node.getPath() +
				"." +
				child1.name +
				"." +
				child2.name +
				"." +
				child3.name,
		);
	});

	const versionTree = () => {
		const root = new TreeNode("root");
		const children = [new TreeNode("a", root), new TreeNode("b", root)];
		const leaves = children.flatMap((child) => [
			new TreeNode(child.name + "0", child),
			new TreeNode(child.name + "1", child),
		]);
		const nodes = [root, ...children, ...leaves];
		const changes = new Map<ITreeNode, number>();
		for (const node of nodes) {
			changes.set(node, 0);
			node.updateCallback = () =>
				changes.set(node, changes.get(node)! + 1);
		}
		return {root, children, leaves, nodes, changes};
	};

	test("updateVersion on the root changes every node exactly once", async () => {
		const {root, nodes, changes} = versionTree();
		const before = nodes.map((node) => node.version);

		root.updateVersion();

		nodes.forEach((node, i) => {
			expect(node.version).not.toBe(before[i]);
			expect(changes.get(node)).toBe(1);
		});
	});

	test("updateVersion on a leaf changes the leaf and its ancestors once", async () => {
		const {root, children, leaves, nodes, changes} = versionTree();
		const before = new Map(nodes.map((node) => [node, node.version]));
		const changed = [leaves[0], children[0], root];

		leaves[0].updateVersion();

		for (const node of nodes) {
			const expected = changed.includes(node) ? 1 : 0;
			expect(changes.get(node)).toBe(expected);
			expect(node.version !== before.get(node)).toBe(expected === 1);
		}
	});

	test("updateVersion without parents and children changes one node", async () => {
		const {children, nodes, changes} = versionTree();

		children[0].updateVersion(false, false);

		for (const node of nodes)
			expect(changes.get(node)).toBe(node === children[0] ? 1 : 0);
	});

	test("versions differ across nodes", async () => {
		const versions = new Set<string>();
		const nodes = Array.from({length: 50}, (_, i) => new TreeNode());
		nodes.forEach((node) => versions.add(node.version));
		nodes.forEach((node) => node.updateVersion());
		nodes.forEach((node) => versions.add(node.version));
		const clone = nodes[0].clone();
		versions.add(clone.version);
		expect(versions.size).toBe(101);
		for (const version of versions) expect(version).toMatch(/^v\d+$/);
		// ids stay uuids and do not change with the version
		const id = nodes[0].id;
		nodes[0].updateVersion();
		expect(nodes[0].id).toBe(id);
		expect(clone.originalId).toBe(nodes[0].originalId);
	});
});

describe("change clock and change kinds (SS-10565)", () => {
	/** A data item whose changes are light changes. */
	class LightLikeData extends AbstractTreeNodeData {
		public get changeKind(): SceneNodeChangeKind {
			return "light";
		}
	}

	/** The kinds that have a clock value later than `serial`. */
	const kindsAfter = (node: ITreeNode, serial: number) => {
		const serials = (node as TreeNode).changeSerials;
		return (Object.keys(serials) as SceneNodeChangeKind[]).filter(
			(kind) => serials[kind] > serial,
		);
	};

	/** A parent with one child, both read by a viewport. */
	const readTree = () => {
		const parent = new TreeNode("parent");
		const child = new TreeNode("child", parent);
		markTreeRead();
		return {parent, child, before: currentSerial()};
	};

	test("versions are values of the clock", async () => {
		const node = new TreeNode();
		const now = currentSerial();
		expect(currentSerial()).toBe(now);
		node.updateVersion(false, false);
		expect(node.version).toBe("v" + (now + 1));
		expect(node.serial).toBe(now + 1);
		expect(nextSerial()).toBe(now + 2);
		node.version = "custom";
		expect(node.serial).toBe(0);
	});

	test("visible records visibility only when the value changes", async () => {
		const {child, before} = readTree();
		child.visible = true;
		expect(kindsAfter(child, before)).toEqual([]);
		child.visible = false;
		expect(kindsAfter(child, before)).toEqual(["visibility"]);
		const hidden = currentSerial();
		child.visible = false;
		expect(kindsAfter(child, hidden)).toEqual([]);
	});

	test("the transformation setters record transformation", async () => {
		const {child} = readTree();
		const transformation = {id: "t", matrix: mat4.create()};
		let serial = currentSerial();
		child.addTransformation(transformation);
		expect(kindsAfter(child, serial)).toEqual(["transformation"]);
		serial = currentSerial();
		child.removeTransformation(transformation);
		expect(kindsAfter(child, serial)).toEqual(["transformation"]);
		serial = currentSerial();
		child.removeTransformation(transformation);
		expect(kindsAfter(child, serial)).toEqual([]);
		child.transformations = [transformation];
		expect(kindsAfter(child, serial)).toEqual(["transformation"]);
	});

	test("addChild and removeChild record structure on the parent", async () => {
		const {parent, child, before} = readTree();
		const other = new TreeNode("other");
		parent.addChild(other);
		expect(kindsAfter(parent, before)).toEqual(["structure"]);
		expect(kindsAfter(child, before)).toEqual([]);
		const serial = currentSerial();
		parent.removeChild(child);
		expect(kindsAfter(parent, serial)).toEqual(["structure"]);
		expect(kindsAfter(child, before)).toEqual([]);
	});

	test("data added, removed or versioned records the item's kind", async () => {
		const {child} = readTree();
		const geometry = new CustomData({});
		const light = new LightLikeData();
		let serial = currentSerial();
		child.addData(geometry);
		expect(kindsAfter(child, serial)).toEqual(["geometry"]);
		serial = currentSerial();
		child.addData(light);
		// only the kind of the item that was added or removed
		expect(kindsAfter(child, serial)).toEqual(["light"]);
		serial = currentSerial();
		light.updateVersion();
		expect(kindsAfter(child, serial)).toEqual(["light"]);
		serial = currentSerial();
		child.removeData(geometry);
		expect(kindsAfter(child, serial)).toEqual(["geometry"]);
		serial = currentSerial();
		child.addData(new CustomData({}));
		expect(kindsAfter(child, serial)).toEqual(["geometry"]);
		serial = currentSerial();
		child.removeData(light);
		expect(kindsAfter(child, serial)).toEqual(["light"]);
		serial = currentSerial();
		child.data.pop();
		expect(kindsAfter(child, serial)).toEqual(["geometry"]);
	});

	test("any number of items added or removed at once records their kind", async () => {
		const {child} = readTree();
		const items = Array.from({length: 128}, () => new CustomData({}));
		let serial = currentSerial();
		child.addData(items);
		expect(kindsAfter(child, serial)).toEqual(["geometry"]);
		serial = currentSerial();
		child.removeData(items);
		expect(kindsAfter(child, serial)).toEqual(["geometry"]);
	});

	test("a change without a version records its kind on the data's nodes", async () => {
		const {parent, child} = readTree();
		const geometry = new CustomData({});
		child.addData(geometry);
		const version = child.version;
		const parentVersion = parent.version;
		const serial = currentSerial();
		geometry.noteParentsChange("material");
		expect(kindsAfter(child, serial)).toEqual(["material"]);
		expect(child.version).toBe(version);
		expect(parent.version).toBe(parentVersion);
	});

	test("updateVersion records no kind", async () => {
		const {parent, child, before} = readTree();
		const version = child.version;
		child.updateVersion();
		expect(child.version).not.toBe(version);
		expect(child.serial).toBeGreaterThan(before);
		expect(kindsAfter(child, 0)).toEqual([]);
		expect(kindsAfter(parent, 0)).toEqual([]);
	});

	test("a node created after the last read records nothing", async () => {
		markTreeRead();
		const node = new TreeNode("new");
		const child = new TreeNode("child", node);
		node.visible = false;
		node.addTransformation({id: "t", matrix: mat4.create()});
		node.addData(new CustomData({}));
		node.removeChild(child);
		expect(kindsAfter(node, 0)).toEqual([]);
		// read from now on
		markTreeRead();
		node.visible = true;
		expect(kindsAfter(node, 0)).toEqual(["visibility"]);
	});

	test("structureVersion changes on add and remove", async () => {
		const {parent} = readTree();
		const first = parent.structureVersion;
		const other = new TreeNode("other");
		parent.addChild(other);
		const second = parent.structureVersion;
		expect(second).not.toBe(first);
		parent.removeChild(other);
		expect(parent.structureVersion).not.toBe(second);
	});
});

describe("log of changed children (SS-10564)", () => {
	/** A parent with `count` children, and a grandchild below the first. */
	const family = (count: number) => {
		const parent = new TreeNode("parent");
		const children: TreeNode[] = [];
		for (let i = 0; i < count; i++)
			children.push(new TreeNode("c" + i, parent));
		const grandchild = new TreeNode("g", children[0]);
		// A viewport read the tree.
		markTreeRead();
		return {parent, children, grandchild};
	};
	const names = (
		entries: {child: ITreeNode; removed: boolean}[] | undefined,
	) => entries?.map((e) => (e.removed ? "-" : "") + e.child.name);

	test("updateVersion logs the node in its parent and each ancestor in its own", async () => {
		const {parent, children, grandchild} = family(3);
		const before = currentSerial();
		grandchild.updateVersion();
		expect(names(changedChildrenSince(children[0], before))).toEqual(["g"]);
		expect(names(changedChildrenSince(parent, before))).toEqual(["c0"]);
		expect(changedChildrenSince(children[1], before)).toEqual([]);
	});

	test("the entries carry clock values; only later ones are returned", async () => {
		const {parent, children} = family(3);
		children[1].updateVersion();
		const between = currentSerial();
		children[2].updateVersion();
		const entry = parent.changedChildren[parent.changedChildren.length - 1];
		expect(entry.serial).toBe(children[2].serial);
		expect(names(changedChildrenSince(parent, between))).toEqual(["c2"]);
		expect(changedChildrenSince(parent, currentSerial())).toEqual([]);
	});

	test("the same child again updates the last entry; a reader sees each child once", async () => {
		const {parent, children} = family(3);
		const before = currentSerial();
		const length = parent.changedChildren.length;
		children[1].updateVersion();
		children[1].updateVersion();
		expect(parent.changedChildren.length).toBe(length + 1);
		children[2].updateVersion();
		children[1].updateVersion();
		expect(names(changedChildrenSince(parent, before))).toEqual([
			"c2",
			"c1",
		]);
	});

	test("updateVersion(false, false) logs the node, children = true logs each descendant", async () => {
		const {parent, children, grandchild} = family(2);
		const before = currentSerial();
		children[1].updateVersion(false, false);
		expect(names(changedChildrenSince(parent, before))).toEqual(["c1"]);
		const between = currentSerial();
		children[0].updateVersion(false, true);
		expect(names(changedChildrenSince(children[0], between))).toEqual([
			grandchild.name,
		]);
		expect(names(changedChildrenSince(parent, between))).toEqual(["c0"]);
	});

	test("addChild and removeChild log the child", async () => {
		const {parent} = family(2);
		const before = currentSerial();
		const added = new TreeNode("added");
		parent.addChild(added);
		expect(names(changedChildrenSince(parent, before))).toEqual(["added"]);
		parent.removeChild(added);
		expect(names(changedChildrenSince(parent, before))).toEqual(["-added"]);
	});

	test("a move to another parent logs a removal and an addition", async () => {
		const other = new TreeNode("other");
		const {parent, children} = family(2);
		const before = currentSerial();
		other.addChild(children[1]);
		expect(names(changedChildrenSince(parent, before))).toEqual(["-c1"]);
		expect(names(changedChildrenSince(other, before))).toEqual(["c1"]);
	});

	test("an overflow clears the log; a reader from before looks at all children", async () => {
		const {parent, children} = family(3);
		const before = currentSerial();
		// More distinct entries than children + 1.
		for (let i = 0; i < 3; i++)
			for (const child of children) child.updateVersion();
		expect(parent.changedChildren.length).toBeLessThanOrEqual(
			children.length + 1,
		);
		expect(parent.changedChildrenReset).toBeGreaterThan(before);
		expect(changedChildrenSince(parent, before)).toBeUndefined();
		// A reader from after the reset reads the entries since.
		const since = changedChildrenSince(parent, parent.changedChildrenReset);
		expect(since).toBeDefined();
		expect(since!.length).toBeGreaterThan(0);
	});

	test("a clone starts with its own log", async () => {
		const {parent, children} = family(2);
		children[1].updateVersion();
		const clone = parent.clone() as TreeNode;
		expect(
			clone.changedChildren.every((e) => e.child.parent === clone),
		).toBe(true);
	});

	test("a child added or removed is logged in every ancestor, without updateVersion", async () => {
		const {parent, children, grandchild} = family(2);
		const before = currentSerial();
		const added = new TreeNode("added");
		grandchild.addChild(added);
		expect(names(changedChildrenSince(grandchild, before))).toEqual([
			"added",
		]);
		expect(names(changedChildrenSince(children[0], before))).toEqual(["g"]);
		expect(names(changedChildrenSince(parent, before))).toEqual(["c0"]);
	});

	test("entries every reader had the chance to apply are dropped at the next entry", async () => {
		const {parent, children} = family(3);
		const removed = children[2];
		parent.removeChild(removed);
		// A viewport visits the parent: it applied the removal.
		markTreeRead();
		const applied = currentSerial();
		children[1].updateVersion();
		expect(parent.changedChildren.map((e) => e.child)).toEqual([
			children[1],
		]);
		// A reader that applied the removal reads on; one that did not
		// looks at all children.
		expect(names(changedChildrenSince(parent, applied))).toEqual(["c1"]);
		expect(changedChildrenSince(parent, applied - 2)).toBeUndefined();
	});

	test("a node nobody has read logs nothing", async () => {
		markTreeRead();
		const parent = new TreeNode("unread");
		const child = new TreeNode("child", parent);
		child.updateVersion();
		expect(parent.changedChildren).toEqual([]);
	});

	test("visible without updateVersion logs nothing", async () => {
		const {parent, children} = family(2);
		const before = currentSerial();
		children[1].visible = false;
		expect(changedChildrenSince(parent, before)).toEqual([]);
	});

	test("a node of another implementation has no log", async () => {
		const foreign = {children: []} as unknown as ITreeNode;
		expect(changedChildrenSince(foreign, 0)).toBeUndefined();
	});
});
