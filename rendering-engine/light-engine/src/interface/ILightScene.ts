import { TreeNode } from '@shapediver/viewer.shared.node-tree'

import { ILight } from './ILight'

export interface ILightScene {
    // #region Properties (3)

    id: string;
    name?: string
    lights: { [key: string]: ILight; };
    node: TreeNode;

    // #endregion Properties (3)
}