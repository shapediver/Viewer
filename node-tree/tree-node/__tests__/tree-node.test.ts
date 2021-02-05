import { mat4 } from 'gl-matrix';

import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';

import { ITransformation, TreeNode } from '../src/TreeNode';

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
      expect(node.getChildAt(i).name).toEqual(clonedNode.getChildAt(i).name);

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