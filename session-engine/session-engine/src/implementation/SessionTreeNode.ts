import { mat4 } from 'gl-matrix';

import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';
import { ITransformation, TreeNode } from '@shapediver/viewer.node-tree.tree-node';

export class SessionTreeNode extends TreeNode {
  // #region Properties (1)

  private readonly _sessionNode: boolean = true;

  // #endregion Properties (1)

  // #region Constructors (1)

  /**
   * Special scene graph node for session data. Only to be created internally.
   * 
   * @param name the name of the node 
   * @param id the id of the node
   * @param parent the parent of this node
   * @param data the array of data 
   * @param transformation the array of transformations
   */
  constructor(
    name?: string,
    id?: string,
    parent?: TreeNode | null,
    data?: ITreeNodeData[],
    transformations?: ITransformation[]
  ) {
    super(name, parent, data, transformations);
    if (id) this._id = id;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  /**
   * Getter sessionNode
   * @return {boolean }
   */
  public get sessionNode(): boolean {
    return this._sessionNode;
  }

  // #endregion Public Accessors (1)

}