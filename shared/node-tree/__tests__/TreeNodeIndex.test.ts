import {type ITreeNode, Tree, TreeNode, TreeNodeIndex} from "../src";

describe("tree node index - test", () => {
	let tree: Tree;
	let root: ITreeNode;

	// The value of a node whose name starts with "x" is its visibility.
	const create = () =>
		new TreeNodeIndex<boolean>((node) =>
			node.name.startsWith("x") ? node.visible : undefined,
		);
	const names = (index: TreeNodeIndex<boolean>) =>
		index.entries(root).map((entry) => entry.node.name);
	const changes = (nodes: ITreeNode[], removed: ITreeNode[] = []) => ({
		nodes,
		removedNodeIds: removed.map((node) => node.id),
	});

	beforeEach(() => {
		tree = Tree.instance;
		root = tree.root;
	});

	// Tree is a singleton, so remove whatever a test added to the root
	afterEach(() => {
		[...root.children].forEach((child) => tree.removeNode(child));
	});

	test("rebuild lists the nodes of the tree in tree order", () => {
		const a = new TreeNode("a");
		const x1 = new TreeNode("x1");
		const x2 = new TreeNode("x2", a);
		const x3 = new TreeNode("x3");
		tree.addNode(a, root);
		tree.addNode(x1, root);
		tree.addNode(x3, root);
		expect(x2.parent).toBe(a);

		const index = create();
		index.rebuild(root);

		// x2 is below a, which comes before x1.
		expect(names(index)).toEqual(["x2", "x1", "x3"]);
		expect(index.size).toBe(3);
	});

	test("apply adds a node where it is in the tree", () => {
		const x1 = new TreeNode("x1");
		const middle = new TreeNode("middle");
		const x3 = new TreeNode("x3");
		[x1, middle, x3].forEach((node) => tree.addNode(node, root));
		const index = create();
		index.rebuild(root);
		const version = index.version;
		expect(names(index)).toEqual(["x1", "x3"]);

		// The new node is below the node between the two.
		const x2 = new TreeNode("x2");
		tree.addNode(x2, middle);
		index.apply(changes([middle, x2]), root);

		expect(index.version).not.toBe(version);
		expect(index.get(x2.id)).toBeDefined();
		expect(names(index)).toEqual(["x1", "x2", "x3"]);
	});

	test("apply drops a node that was removed and keeps the order of the rest", () => {
		const x1 = new TreeNode("x1");
		const x2 = new TreeNode("x2");
		const x3 = new TreeNode("x3");
		[x1, x2, x3].forEach((node) => tree.addNode(node, root));
		const index = create();
		index.rebuild(root);
		expect(names(index)).toEqual(["x1", "x2", "x3"]);

		tree.removeNode(x2);
		index.apply(changes([], [x2]), root);

		expect(index.get(x2.id)).toBeUndefined();
		expect(names(index)).toEqual(["x1", "x3"]);
	});

	test("apply keeps a node that was moved and lists it in its new place", () => {
		const a = new TreeNode("a");
		const b = new TreeNode("b");
		const x = new TreeNode("x");
		const y = new TreeNode("y");
		tree.addNode(a, root);
		tree.addNode(b, root);
		tree.addNode(x, a);
		tree.addNode(y, b);
		const index = create();
		index.rebuild(root);
		expect(names(index)).toEqual(["x"]);

		// x moves below b: it is reported as removed (it left a) and as
		// changed (it was converted again below b).
		b.addChild(x);
		index.apply(changes([b, x], [x]), root);

		expect(index.get(x.id)).toBeDefined();
		expect(names(index)).toEqual(["x"]);
		expect(x.parent).toBe(b);
	});

	test("apply lists a node that was moved after the node it now follows", () => {
		const a = new TreeNode("a");
		const b = new TreeNode("b");
		const x1 = new TreeNode("x1");
		const x2 = new TreeNode("x2");
		tree.addNode(a, root);
		tree.addNode(b, root);
		tree.addNode(x1, a);
		tree.addNode(x2, b);
		const index = create();
		index.rebuild(root);
		expect(names(index)).toEqual(["x1", "x2"]);
		const version = index.version;

		// x1 moves below b, behind x2. The value is the same as before.
		b.addChild(x1);
		index.apply(changes([b, x1], [x1]), root);

		expect(names(index)).toEqual(["x2", "x1"]);
		expect(index.version).not.toBe(version);
	});

	test("apply leaves the version alone for a value that is the same", () => {
		const x1 = new TreeNode("x1");
		tree.addNode(x1, root);
		const index = create();
		index.rebuild(root);
		const version = index.version;
		const entry = index.get(x1.id);

		index.apply(changes([x1]), root);
		expect(index.version).toBe(version);
		expect(index.get(x1.id)).toBe(entry);

		x1.visible = false;
		index.apply(changes([x1]), root);
		expect(index.version).not.toBe(version);
		expect(index.get(x1.id)?.value).toBe(false);
		// The entry stays in place: the order is not made again for this.
		expect(index.get(x1.id)).toBe(entry);
	});

	test("apply ignores a node that is not attached to the tree", () => {
		const index = create();
		index.rebuild(root);
		const version = index.version;

		const loose = new TreeNode("x-loose");
		index.apply(changes([loose]), root);

		expect(index.version).toBe(version);
		expect(index.get(loose.id)).toBeUndefined();
	});
});
