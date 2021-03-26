import { mat4 } from 'gl-matrix';
import { container } from 'tsyringe'

import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { ITreeNodeData } from './interfaces/ITreeNodeData';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';

export interface ITransformation {
  // #region Properties (3)

  id: string,
  matrix: mat4
  name: string,

  // #endregion Properties (3)
}

export class TreeNode {
  // #region Properties (9)

  readonly #children: TreeNode[] = [];
  readonly #data: ITreeNodeData[] = [];
  readonly #eventEngine = container.resolve(EventEngine);
  readonly #name: string = '';
  readonly #uuidGenerator = container.resolve(UuidGenerator);

  #id: string;
  #parent: TreeNode | null = null;
  #transformations: ITransformation[] = [];
  #version: string;

  // #endregion Properties (9)

  // #region Constructors (1)

  /**
   * Creation of a node that can be used in the node tree.
   * 
   * @param name the name of the node
   * @param parent the parent of this node
   * @param data the array of data 
   * @param transformations the array of transformations
   */
  constructor(
    name: string = '',
    parent: TreeNode | null = null,
    data: ITreeNodeData[] = [],
    transformations: ITransformation[] = []
  ) {
    this.#name = name;
    this.#parent = parent;
    this.#data = data;
    this.#transformations = transformations;

    this.#id = this.#uuidGenerator.create();
    this.#version = this.#uuidGenerator.create();
    this.#parent?.addChild(this);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (10)

  /**
   * Getter data
   * @return {ITreeNodeData[]}
   */
  public get data(): ITreeNodeData[] {
    return this.#data;
  }

  /**
   * Setter id
   */
  public set id(value: string) {
    this.#id = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this.#id;
  }

  /**
   * Getter name
   * @return {string }
   */
  public get name(): string {
    return this.#name;
  }

  /**
   * Getter node matrix
   * @return {mat4}
   */
  public get nodeMatrix(): mat4 {
    const matrix: mat4 = mat4.create();
    for (let transform of this.#transformations)
      mat4.multiply(matrix, matrix, transform.matrix);
    return matrix;
  }

  /**
   * Getter parent
   * @return {TreeNode | null}
   */
  public get parent(): TreeNode | null {
    return this.#parent;
  }

  /**
   * Setter parent
   * @param {TreeNode | null} value
   */
  public set parent(value: TreeNode | null) {
    // check if it was removed from previous parent
    if (value === null && this.#parent !== null)
      this.#parent.removeChild(this);

    // check if it is in children of new parent
    if (value !== null)
      value.addChild(this);

    this.#parent = value;
  }

  /**
   * Getter transformation
   * @return {ITransformation[]}
   */
  public get transformations(): ITransformation[] {
    return this.#transformations;
  }

  /**
   * Setter transformation
   * @param {ITransformation[]} value
   */
  public set transformations(value: ITransformation[]) {
    this.#transformations = value;
  }

  /**
   * Getter version
   * @return {string}
   */
  public get version(): string {
    return this.#version;
  }

  /**
   * Getter world matrix
   * @return {mat4}
   */
  public get worldMatrix(): mat4 {
    const matrix: mat4 = mat4.create();

    for (let transform of this.#transformations)
      mat4.multiply(matrix, matrix, transform.matrix);

    let node: TreeNode = this;
    while (node.parent) {
      mat4.multiply(matrix, matrix, node.parent.nodeMatrix);
      node = node.parent;
    }

    return matrix;
  }

  // #endregion Public Accessors (10)

  // #region Public Methods (11)

  /**
   * Add a child from the children of this node.
   * 
   * @param child the child to add
   */
  public addChild(child: TreeNode): boolean {
    if (this.hasChild(child)) return false;

    this.#children.push(child);
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
    for (let child of this.#children)
      clone.addChild(child.clone());
    for (let data of this.#data)
      clone.data.push(data.clone());
    for (let transform of this.#transformations)
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
    for (let child of this.#children)
      clone.addChild(child.cloneInstance());
    for (let data of this.#data)
      clone.data.push(data);
    for (let transform of this.#transformations)
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
  public getChild(id: string): TreeNode | null {
    for (let i = 0; i < this.#children.length; i++)
      if (this.#children[i].id === id)
        return this.#children[i];
    return null;
  }

  /**
   * Getter child
   * @return {TreeNode}
   */
  public getChildAt(index: number): TreeNode | null {
    if (!this.#children[index]) return null;
    return this.#children[index];
  }

  /**
   * Get Number of children
   * @return {number}
   */
  public getNumberOfChildren(): number {
    return this.#children.length;
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
    return this.#children.includes(child);
  }

  /**
   * Remove a child from the children of this node.
   * 
   * @param child the child to remove
   */
  public removeChild(child: TreeNode): boolean {
    const index = this.#children.indexOf(child);
    if (index === -1) return false;
    this.#children.splice(index, 1);
    child.parent = null;
    return true;
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

    for (let i = 0; i < this.#data.length; i++)
      this.#data[i].updateVersion();

    for (let i = 0; i < this.#children.length; i++)
      this.#children[i].updateVersion();

    this.#version = this.#uuidGenerator.create();
    this.#eventEngine.emitEvent(EVENTTYPE.UPDATE.UPDATE_READY, {});
  }

  /**
   * Only updates the version of this node.
   */
  public updateVersionAtomic(): void {
    this.#version = this.#uuidGenerator.create();
    this.#eventEngine.emitEvent(EVENTTYPE.UPDATE.UPDATE_READY, {});
  }

  // #endregion Public Methods (11)
}