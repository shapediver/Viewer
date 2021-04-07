import "reflect-metadata"
import { Tree } from '../src/Tree';
import { ITransformation, TreeNode } from '../src/TreeNode';
import { ITreeNodeData } from '../src/interfaces/ITreeNodeData';

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
    expect(root.getChildAt(0)!.name).toBe(name)
  });

  test('add multiple children', async () => {
    const name1 = 'test1';
    const node1 = new TreeNode(name1);
    const result1 = tree.addNode(node1, root);

    expect(result1).toBe(true);
    expect(root.getNumberOfChildren()).toBe(1);
    const child1 = root.getChildAt(0);
    expect(child1!.name).toBe(name1);

    const name2 = 'test2';
    const node2 = new TreeNode(name2);
    const result2 = tree.addNode(node2, node1);

    expect(result2).toBe(true);
    expect(child1!.getNumberOfChildren()).toBe(1);
    const child2 = child1!.getChildAt(0);
    expect(child2!.name).toBe(name2);

    const name3 = 'test3';
    const node3 = new TreeNode(name3);
    const result3 = tree.addNode(node3, node2);

    expect(result3).toBe(true);
    expect(child2!.getNumberOfChildren()).toBe(1);
    const child3 = child2!.getChildAt(0);
    expect(child3!.name).toBe(name3);
    expect(child3!.getNumberOfChildren()).toBe(0);

    const name4 = 'test4';
    const node4 = new TreeNode(name4);
    const result4 = tree.addNode(node4, node2);

    expect(result4).toBe(true);
    expect(child2!.getNumberOfChildren()).toBe(2);
    const child4 = child2!.getChildAt(1);
    expect(child4!.name).toBe(name4);
    expect(child4!.getNumberOfChildren()).toBe(0);
  });

  test('add a child via path', async () => {
    const name = 'test';
    const node = new TreeNode(name);
    tree.addNodeAtPath(node, root.getPath());

    expect(root.getNumberOfChildren()).toBe(1);
    expect(root.getChildAt(0)!.name).toBe(name)
  });

  test('add multiple children via path', async () => {
    const name1 = 'test1';
    const node1 = new TreeNode(name1);
    const result1 = tree.addNodeAtPath(node1, root.getPath());

    expect(result1).toBe(true);
    expect(root.getNumberOfChildren()).toBe(1);
    const child1 = root.getChildAt(0);
    expect(child1!.name).toBe(name1);

    const name2 = 'test2';
    const node2 = new TreeNode(name2);
    const result2 = tree.addNodeAtPath(node2, node1.getPath());

    expect(result2).toBe(true);
    expect(child1!.getNumberOfChildren()).toBe(1);
    const child2 = child1!.getChildAt(0);
    expect(child2!.name).toBe(name2);

    const name3 = 'test3';
    const node3 = new TreeNode(name3);
    const result3 = tree.addNodeAtPath(node3, node2.getPath());

    expect(result3).toBe(true);
    expect(child2!.getNumberOfChildren()).toBe(1);
    const child3 = child2!.getChildAt(0);
    expect(child3!.name).toBe(name3);
    expect(child3!.getNumberOfChildren()).toBe(0);

    const name4 = 'test4';
    const node4 = new TreeNode(name4);
    const result4 = tree.addNodeAtPath(node4, node2.getPath());

    expect(result4).toBe(true);
    expect(child2!.getNumberOfChildren()).toBe(2);
    const child4 = child2!.getChildAt(1);
    expect(child4!.name).toBe(name4);
    expect(child4!.getNumberOfChildren()).toBe(0);
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

describe('scene graph node - test', () => {
  beforeEach(() => {
  });

  test('test creation', async () => {
    const name = 'name';
    const data: ITreeNodeData[] = [];
    const transformations: ITransformation[] = [];
    const node = new TreeNode(name, null, data, transformations);

    expect(node.name).toBe(name);
    expect(node.data).toStrictEqual(data);
    expect(node.transformations).toBe(transformations);

    const node2 = new TreeNode(name, node, data, transformations);
    expect(node.hasChild(node2)).toBe(true);
  });

  test('adding children', async () => {
    const node = new TreeNode('testRoot');
    node.addChild(new TreeNode('child1'));
    node.addChild(new TreeNode('child2'));
    node.addChild(new TreeNode('child3'));
    node.addChild(new TreeNode('child4'));
    node.addChild(new TreeNode('child5'));

    expect(node.getNumberOfChildren()).toBe(5)
  });

  test('having children', async () => {
    const node = new TreeNode('testRoot');
    const child1 = new TreeNode('child1');
    node.addChild(child1);
    const child2 = new TreeNode('child2');
    node.addChild(child2);
    const child3 = new TreeNode('child3');
    node.addChild(child3);
    const child4 = new TreeNode('child4');
    node.addChild(child4);
    const child5 = new TreeNode('child5');
    node.addChild(child5);
    const child6 = new TreeNode('child6');

    expect(node.getNumberOfChildren()).toBe(5);

    expect(node.hasChild(child1)).toBe(true);
    expect(node.hasChild(child2)).toBe(true);
    expect(node.hasChild(child3)).toBe(true);
    expect(node.hasChild(child4)).toBe(true);
    expect(node.hasChild(child5)).toBe(true);
    expect(node.hasChild(child6)).toBe(false);
  });

  test('removing children', async () => {
    const node = new TreeNode('testRoot');
    const child1 = new TreeNode('child1');
    node.addChild(child1);
    const child2 = new TreeNode('child2');
    node.addChild(child2);
    const child3 = new TreeNode('child3');
    node.addChild(child3);
    const child4 = new TreeNode('child4');
    node.addChild(child4);
    const child5 = new TreeNode('child5');
    node.addChild(child5);
    const child6 = new TreeNode('child6');

    expect(node.getNumberOfChildren()).toBe(5);

    expect(node.hasChild(child1)).toBe(true);
    expect(node.hasChild(child2)).toBe(true);
    expect(node.hasChild(child3)).toBe(true);
    expect(node.hasChild(child4)).toBe(true);
    expect(node.hasChild(child5)).toBe(true);
    expect(node.hasChild(child6)).toBe(false);

    node.removeChild(child1);
    node.removeChild(child2);

    expect(node.getNumberOfChildren()).toBe(3);
    expect(node.hasChild(child1)).toBe(false);
    expect(node.hasChild(child2)).toBe(false);
    expect(node.hasChild(child3)).toBe(true);
    expect(node.hasChild(child4)).toBe(true);
    expect(node.hasChild(child5)).toBe(true);
    expect(node.hasChild(child6)).toBe(false);

    node.addChild(child1);

    expect(node.getNumberOfChildren()).toBe(4);
    expect(node.hasChild(child1)).toBe(true);
    expect(node.hasChild(child2)).toBe(false);
    expect(node.hasChild(child3)).toBe(true);
    expect(node.hasChild(child4)).toBe(true);
    expect(node.hasChild(child5)).toBe(true);
    expect(node.hasChild(child6)).toBe(false);
  });

  test('test cloning', async () => {
    const name = 'name';
    const data: ITreeNodeData[] = [];
    const transformations: ITransformation[] = [];
    const node = new TreeNode(name, null, data, transformations);
    const clonedNode = node.clone();
    expect(node.name).toBe(clonedNode.name);
    expect(node.parent).toBe(clonedNode.parent);
    expect(node.data).toStrictEqual(clonedNode.data);
    expect(node.transformations).toStrictEqual(clonedNode.transformations);
    expect(node.version).not.toBe(clonedNode.version);
  });

  test('test cloning children', async () => {
    const name = 'name';
    const data: ITreeNodeData[] = [];
    const transformations: ITransformation[] = [];
    const node = new TreeNode(name, null, data, transformations);
    node.addChild(new TreeNode('child1'));
    node.addChild(new TreeNode('child2'));
    new TreeNode('child3', node)
    const clonedNode = node.clone();
    expect(node.getNumberOfChildren()).toEqual(clonedNode.getNumberOfChildren());
    expect(node.getNumberOfChildren()).toEqual(3);
    for (let i = 0; i < node.getNumberOfChildren(); i++)
      expect(node.getChildAt(i)!.name).toEqual(clonedNode.getChildAt(i)!.name);

  });

  test('path lookup', async () => {
    const node = new TreeNode('testRoot');
    const child1 = new TreeNode('child1');
    node.addChild(child1);
    const child2 = new TreeNode('child2');
    child1.addChild(child2);
    const child3 = new TreeNode('child3');
    child2.addChild(child3);

    expect(child1.getPath()).toBe(node.getPath() + '.' + child1.id);
    expect(child2.getPath()).toBe(node.getPath() + '.' + child1.id + '.' + child2.id);
    expect(child3.getPath()).toBe(node.getPath() + '.' + child1.id + '.' + child2.id + '.' + child3.id);
  });
})