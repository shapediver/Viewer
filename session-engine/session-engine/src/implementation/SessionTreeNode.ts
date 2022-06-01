import { mat4 } from 'gl-matrix'
import { ITransformation, ITreeNode, ITreeNodeData, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { ISessionTreeNode } from '../interfaces/ISessionTreeNode';

export class SessionTreeNode extends TreeNode implements ISessionTreeNode {
  // #region Properties (1)

  readonly #sessionNode: boolean = true;

  // #endregion Properties (1)

  // #region Constructors (1)

  /**
   * Special scene graph node for session data. Only to be created internally.
   * 
   * @param name the name of the node 
   * @param parent the parent of this node
   * @param data the array of data 
   * @param transformation the array of transformations
   */
  constructor(
    name?: string,
    parent?: ITreeNode,
    data?: ITreeNodeData[],
    transformations?: ITransformation[]
  ) {
    super(name, parent, data, transformations);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get sessionNode(): boolean {
    return this.#sessionNode;
  }

  // #endregion Public Accessors (1)

}