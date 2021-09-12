import { vec3 } from 'gl-matrix'
import { singleton } from 'tsyringe'

import { TreeNode } from './TreeNode'

@singleton()
export class Tree {
  // #region Properties (1)

  readonly #root = new TreeNode('root');

  // #endregion Properties (1)

  // #region Constructors (1)

  /**
   * @ignore
   * Management of the main tree node.
   */
  constructor() { }

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get root(): TreeNode {
    return this.#root;
  }

  // #endregion Public Accessors (1)

  // #region Public Methods (4)

  /**
   * Add the node as a child of the corresponding parent node.
   * 
   * @param node the node to be added
   * @param parent the targeted parent node
   * @param root optional root at which the process begins, root node will be used per default
   */
  public addNode(node: TreeNode, parent: TreeNode = this.#root, root: TreeNode = this.#root): boolean {
    if (root === parent) {
      root.addChild(node);
      return true;
    }

    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child && this.addNode(node, parent, child)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add the node at the corresponding path. (paths are dot separated ids)
   * 
   * @param node the node to be added
   * @param path the path at which the node should be added
   * @param root optional root at which the process begins, root node will be used per default
   */
  public addNodeAtPath(node: TreeNode, path: string = this.root.getPath(), root: TreeNode = this.#root): boolean {
    if (root.id === path) {
      root.addChild(node);
      return true;
    }

    const pathStart = path.substr(0, path.indexOf('.'));
    if (root.id === pathStart) {
      const shortenedPath = path.substr(pathStart.length + 1, path.length);

      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i];
        if (child && this.addNodeAtPath(node, shortenedPath, child)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Remove a node from the tree.
   * 
   * @param node the node to remove 
   * @param root optional root at which the process begins, root node will be used per default
   */
  public removeNode(node: TreeNode, root: TreeNode = this.#root): boolean {
    if (root.hasChild(node)) {
      root.removeChild(node);
      return true;
    }

    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child && this.removeNode(node, child)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Remove a node via the path of it.
   * 
   * @param path the path of the node to be removed
   * @param root optional root at which the process begins, root node will be used per default
   */
  public removeNodeAtPath(path: string, root: TreeNode = this.#root): boolean {
    if (root.id === path) {
      root.parent?.removeChild(root);
      return true;
    }

    const pathStart = path.substr(0, path.indexOf('.'));
    if (root.id === pathStart) {
      const shortenedPath = path.substr(pathStart.length + 1, path.length);


      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i];
        if (child && this.removeNodeAtPath(shortenedPath, child)) {
          return true;
        }
      }
    }
    return false;
  }

  // #endregion Public Methods (4)
}