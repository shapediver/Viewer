# `viewer.shared.node-tree`

> This package manages a tree system that is built out of `tree-node`s and `tree-node-data` items. It has various ways of accessing and changing the nodes and data in the tree.

## Install
```
npm install @shapediver/viewer.shared.node-tree
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';

import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree';

// gets the singleton instance
const tree: Tree = <Tree>container.resolve(Tree);

// returns the root node of the tree
const root: TreeNode = tree.root;

// create a node
const node1 = new TreeNode('test-node1');

// adds it to the root of the tree
tree.addNode(node1);

// create a second node
const node2 = new TreeNode('test-node2');

// adds it as a child of the node that was just added
tree.addNode(node2, node1);

```
