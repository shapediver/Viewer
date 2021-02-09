import { mat4 } from 'gl-matrix';

import { ITreeNodeData } from '@shapediver/viewer.node-tree.tree-node-data';
import uuid from '@shapediver/viewer.utils.uuid';

export interface ITransformation {
  // #region Properties (3)

  id: string,
  matrix: mat4
  name: string,

  // #endregion Properties (3)
}

export class TreeNode {
  // #region Properties (3)

  protected readonly _children: TreeNode[] = [];

  protected _id: string;
  protected _version: string;

  // #endregion Properties (3)

  // #region Constructors (1)

  /**
   * Creation of a node that can be used in the node tree.
   * 
   * @param _name the name of the node
   * @param _parent the parent of this node
   * @param _data the array of data 
   * @param _transformations the array of transformations
   */
  constructor(
    protected readonly _name: string = '',
    protected _parent: TreeNode | null = null,
    protected readonly _data: ITreeNodeData[] = [],
    protected _transformations: ITransformation[] = []
  ) {
    this._id = uuid.create();
    this._version = uuid.create();
    this._parent?.addChild(this);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (9)

  /**
   * Getter data
   * @return {ITreeNodeData[]}
   */
  public get data(): ITreeNodeData[] {
    return this._data;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Getter name
   * @return {string }
   */
  public get name(): string {
    return this._name;
  }

  /**
   * Getter node matrix
   * @return {mat4}
   */
  public get nodeMatrix(): mat4 {
    const matrix: mat4 = mat4.create();
    for (let transform of this._transformations)
      mat4.multiply(matrix, matrix, transform.matrix);
    return matrix;
  }

  /**
   * Getter parent
   * @return {TreeNode | null}
   */
  public get parent(): TreeNode | null {
    return this._parent;
  }

  /**
   * Setter parent
   * @param {TreeNode | null} value
   */
  public set parent(value: TreeNode | null) {
    // check if it was removed from previous parent
    if (value === null && this._parent !== null)
      this._parent.removeChild(this);

    // check if it is in children of new parent
    if (value !== null)
      value.addChild(this);

    this._parent = value;
  }

  /**
   * Getter transformation
   * @return {ITransformation[]}
   */
  public get transformations(): ITransformation[] {
    return this._transformations;
  }

  /**
   * Setter transformation
   * @param {ITransformation[]} value
   */
  public set transformations(value: ITransformation[]) {
    this._transformations = value;
  }

  /**
   * Getter version
   * @return {string}
   */
  public get version(): string {
    return this._version;
  }

  // #endregion Public Accessors (9)

  // #region Public Methods (8)

  /**
   * Add a child from the children of this node.
   * 
   * @param child the child to add
   */
  public addChild(child: TreeNode): boolean {
    if (this.hasChild(child)) return false;

    this._children.push(child);
    if (child.parent !== null)
      child.parent.removeChild(child);
    child.parent = this;
    return true;
  }

  /**
   * Clones this node and all its children.
   */
  public clone(): TreeNode {
    const clone = new TreeNode(this.name);
    for (let child of this._children)
      clone.addChild(child.clone());
    for (let data of this._data)
      clone.data.push(data.clone());
    for (let transform of this._transformations)
      clone.transformations.push({
        id: transform.id,
        name: transform.name,
        matrix: mat4.clone(transform.matrix)
      });

    return clone;
  }

  /**
   * Clones this node and all its children.
   */
  public cloneInstance(): TreeNode {
    const clone = new TreeNode(this.name);
    for (let child of this._children)
      clone.addChild(child.cloneInstance());
    for (let data of this._data)
      clone.data.push(data);
    for (let transform of this._transformations)
      clone.transformations.push({
        id: transform.id,
        name: transform.name,
        matrix: mat4.clone(transform.matrix)
      });

    return clone;
  }

  /**
   * Getter child
   * @return {TreeNode}
   */
  public getChildAt(index: number): TreeNode {
    return this._children[index];
  }

  /**
   * Getter child
   * @return {TreeNode}
   */
  public getChild(id: string): TreeNode {
    for(let i = 0; i < this._children.length; i++)
      if(this._children[i].id === id)
        return this._children[i]
    throw new Error();
  }

  /**
   * Get Number of children
   * @return {number}
   */
  public getNumberOfChildren(): number {
    return this._children.length;
  }

  /**
   * Return the path to this node.
   */
  public getPath(): string {
    let path = this.id;
    let node: TreeNode | null = this.parent;
    while (node) {
      path = node.id + '.' + path;
      node = node.parent;
    }
    return path;
  }

  /**
   * Check for existence of a child from the children of this node.
   * 
   * @param child the child to check
   */
  public hasChild(child: TreeNode): boolean {
    return this._children.includes(child);
  }

  /**
   * Remove a child from the children of this node.
   * 
   * @param child the child to remove
   */
  public removeChild(child: TreeNode): boolean {
    const index = this._children.indexOf(child);
    if (index === -1) return false;
    this._children.splice(index, 1);
    child.parent = null;
    return true;
  }

  /**
   * Only updates the version of this node.
   */
  public updateVersionAtomic(): void {
    this._version = uuid.create();
  }

  /**
   * Update the version
   */
  public updateVersion(): void {
    let node = <TreeNode>this;
    while (node.parent !== null) {
      node = node.parent;
      node.updateVersionAtomic();
    }

    for(let i = 0; i < this._data.length; i++)
      this._data[i].updateVersion();

    for(let i = 0; i < this._children.length; i++)
      this._children[i].updateVersion();

    this._version = uuid.create();
  }

  // #endregion Public Methods (8)
}