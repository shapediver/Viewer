import {ITransformation, ITreeNode, ITreeNodeData, Tree, TreeNode} from "../";

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
});
