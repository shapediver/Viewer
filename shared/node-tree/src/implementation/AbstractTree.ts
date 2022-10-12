import { ITree } from '../interfaces/ITree';
import { ITreeNode } from '../interfaces/ITreeNode';
import { ITreeNodeData } from '../interfaces/ITreeNodeData';

export abstract class AbstractTree<T extends ITreeNode<any, ITreeNodeData<any>>> implements ITree<T> {
  // #region Properties (1)

  readonly #root: T;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(root: T) {
    this.#root = root;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get root(): T {
    return this.#root;
  }

  // #endregion Public Accessors (1)

  // #region Public Methods (6)

  public addNode(node: T, parent: T = this.#root, root: T = this.#root): boolean {
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

  public addNodeAtPath(node: T, path: string = this.root.getPath(), root: T = this.#root): boolean {
    if (root.name === path) {
      root.addChild(node);
      return true;
    }

    const pathStart = path.substr(0, path.indexOf('.'));
    if (root.name === pathStart) {
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

  public getNodeAtPath(path: string = this.root.getPath(), root: T = this.#root): T | null {
    if (root.name === path) 
      return root;

    const pathStart = path.substr(0, path.indexOf('.'));
    if (root.name === pathStart) {
      const shortenedPath = path.substr(pathStart.length + 1, path.length);

      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i];
        const res = this.getNodeAtPath(shortenedPath, child);
        if(res) return res;
      }
    }
    return null;
  }

  public removeNode(node: T, root: T = this.#root): boolean {
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

  public removeNodeAtPath(path: string, root: T = this.#root): boolean {
    if (root.name === path) {
      root.parent?.removeChild(root);
      return true;
    }

    const pathStart = path.substr(0, path.indexOf('.'));
    if (root.name === pathStart) {
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

  // #endregion Public Methods (6)
}