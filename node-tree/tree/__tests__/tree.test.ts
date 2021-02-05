import { Tree } from '../src/Tree';
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

describe('scene graph engine - test', () => {
  let tree: Tree;
  let root: TreeNode;

  beforeEach(() => {
    tree = new Tree();
    root = tree.root;
  });

  test('add a child', async () => {
    const name = 'test';
    const node = new TreeNode(name);
    tree.addNode(node, root);

    expect(root.getNumberOfChildren()).toBe(1);
    expect(root.getChildAt(0).name).toBe(name)
  });

  test('add multiple children', async () => {
    const name1 = 'test1';
    const node1 = new TreeNode(name1);
    const result1 = tree.addNode(node1, root);

    expect(result1).toBe(true);
    expect(root.getNumberOfChildren()).toBe(1);
    const child1 = root.getChildAt(0);
    expect(child1.name).toBe(name1);

    const name2 = 'test2';
    const node2 = new TreeNode(name2);
    const result2 = tree.addNode(node2, node1);

    expect(result2).toBe(true);
    expect(child1.getNumberOfChildren()).toBe(1);
    const child2 = child1.getChildAt(0);
    expect(child2.name).toBe(name2);

    const name3 = 'test3';
    const node3 = new TreeNode(name3);
    const result3 = tree.addNode(node3, node2);

    expect(result3).toBe(true);
    expect(child2.getNumberOfChildren()).toBe(1);
    const child3 = child2.getChildAt(0);
    expect(child3.name).toBe(name3);
    expect(child3.getNumberOfChildren()).toBe(0);

    const name4 = 'test4';
    const node4 = new TreeNode(name4);
    const result4 = tree.addNode(node4, node2);

    expect(result4).toBe(true);
    expect(child2.getNumberOfChildren()).toBe(2);
    const child4 = child2.getChildAt(1);
    expect(child4.name).toBe(name4);
    expect(child4.getNumberOfChildren()).toBe(0);
  });

  test('add a child via path', async () => {
    const name = 'test';
    const node = new TreeNode(name);
    tree.addNodeAtPath(node, root.getPath());

    expect(root.getNumberOfChildren()).toBe(1);
    expect(root.getChildAt(0).name).toBe(name)
  });

  test('add multiple children via path', async () => {
    const name1 = 'test1';
    const node1 = new TreeNode(name1);
    const result1 = tree.addNodeAtPath(node1, root.getPath());

    expect(result1).toBe(true);
    expect(root.getNumberOfChildren()).toBe(1);
    const child1 = root.getChildAt(0);
    expect(child1.name).toBe(name1);

    const name2 = 'test2';
    const node2 = new TreeNode(name2);
    const result2 = tree.addNodeAtPath(node2, node1.getPath());

    expect(result2).toBe(true);
    expect(child1.getNumberOfChildren()).toBe(1);
    const child2 = child1.getChildAt(0);
    expect(child2.name).toBe(name2);

    const name3 = 'test3';
    const node3 = new TreeNode(name3);
    const result3 = tree.addNodeAtPath(node3, node2.getPath());

    expect(result3).toBe(true);
    expect(child2.getNumberOfChildren()).toBe(1);
    const child3 = child2.getChildAt(0);
    expect(child3.name).toBe(name3);
    expect(child3.getNumberOfChildren()).toBe(0);

    const name4 = 'test4';
    const node4 = new TreeNode(name4);
    const result4 = tree.addNodeAtPath(node4, node2.getPath());

    expect(result4).toBe(true);
    expect(child2.getNumberOfChildren()).toBe(2);
    const child4 = child2.getChildAt(1);
    expect(child4.name).toBe(name4);
    expect(child4.getNumberOfChildren()).toBe(0);
  });

  test('remove node', async () => {
    const node1 = new TreeNode('n1');
    tree.addNode(node1)
    expect(root.hasChild(node1)).toBe(true);
    tree.removeNode(node1)
    expect(root.hasChild(node1)).toBe(false);
  });

  test('remove multiple nodes', async () => {
    const node1 = new TreeNode('n1');
    const node2 = new TreeNode('n2');
    const node3 = new TreeNode('n3');
    const node4 = new TreeNode('n4');
    const node5 = new TreeNode('n4');
    tree.addNode(node1)
    tree.addNode(node2)
    tree.addNode(node3, node1);
    tree.addNode(node4, node1);
    tree.addNode(node5, node2);

    expect(root.hasChild(node1)).toBe(true);
    expect(root.hasChild(node2)).toBe(true);
    expect(node1.hasChild(node3)).toBe(true);
    expect(node1.hasChild(node4)).toBe(true);
    expect(node2.hasChild(node5)).toBe(true);

    tree.removeNode(node1)
    tree.removeNode(node2)

    expect(root.hasChild(node1)).toBe(false);
    expect(root.hasChild(node2)).toBe(false);
    expect(node1.hasChild(node3)).toBe(true);
    expect(node1.hasChild(node4)).toBe(true);
    expect(node2.hasChild(node5)).toBe(true);

    tree.addNode(node3)

    expect(root.hasChild(node1)).toBe(false);
    expect(root.hasChild(node2)).toBe(false);
    expect(root.hasChild(node3)).toBe(true);
    expect(node1.hasChild(node3)).toBe(false);
    expect(node1.hasChild(node4)).toBe(true);
    expect(node2.hasChild(node5)).toBe(true);

  });

  test('remove node via path', async () => {
    const node1 = new TreeNode('n1');
    tree.addNodeAtPath(node1)
    expect(root.hasChild(node1)).toBe(true);
    tree.removeNodeAtPath(node1.getPath())
    expect(root.hasChild(node1)).toBe(false);
  });

  test('remove multiple nodes via path', async () => {
    const node1 = new TreeNode('n1');
    const node2 = new TreeNode('n2');
    const node3 = new TreeNode('n3');
    const node4 = new TreeNode('n4');
    const node5 = new TreeNode('n4');
    tree.addNodeAtPath(node1)
    tree.addNodeAtPath(node2)
    tree.addNodeAtPath(node3, node1.getPath());
    tree.addNodeAtPath(node4, node1.getPath());
    tree.addNodeAtPath(node5, node2.getPath());

    expect(root.hasChild(node1)).toBe(true);
    expect(root.hasChild(node2)).toBe(true);
    expect(node1.hasChild(node3)).toBe(true);
    expect(node1.hasChild(node4)).toBe(true);
    expect(node2.hasChild(node5)).toBe(true);

    tree.removeNodeAtPath(node1.getPath())
    tree.removeNodeAtPath(node2.getPath())

    expect(root.hasChild(node1)).toBe(false);
    expect(root.hasChild(node2)).toBe(false);
    expect(node1.hasChild(node3)).toBe(true);
    expect(node1.hasChild(node4)).toBe(true);
    expect(node2.hasChild(node5)).toBe(true);

    tree.addNodeAtPath(node3)

    expect(root.hasChild(node1)).toBe(false);
    expect(root.hasChild(node2)).toBe(false);
    expect(root.hasChild(node3)).toBe(true);
    expect(node1.hasChild(node3)).toBe(false);
    expect(node1.hasChild(node4)).toBe(true);
    expect(node2.hasChild(node5)).toBe(true);
  });

})