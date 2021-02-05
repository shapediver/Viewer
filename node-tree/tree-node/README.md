# `viewer.node-tree.tree-node`

> This package manages the nodes that can be used in the tree system `viewer.node-tree.tree`.

## Install
```
npm install @shapediver/viewer.node-tree.tree-node
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import { TreeNode } from '@shapediver/viewer.node-tree.tree-node';

const node = new TreeNode('testNode');

const child = new TreeNode('child');
node.addChild(child);
```