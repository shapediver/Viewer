import { mat4 } from 'gl-matrix'
import { container } from 'tsyringe'
import { UuidGenerator, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'
import { Box } from '@shapediver/viewer.shared.math'

import { ITreeNodeData } from './interfaces/ITreeNodeData'
import { ISDObject } from './interfaces/ISDObject'

export interface ITransformation {
  // #region Properties (3)

  id: string,
  matrix: mat4

  // #endregion Properties (3)
}

export class TreeNode {
  // #region Properties (10)

  readonly #children: TreeNode[] = [];
  readonly #data: ITreeNodeData[] = [];
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #name: string = '';
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

  #boundingBox: Box = new Box();
  #id: string;
  #parent: TreeNode | null = null;
  #transformations: ITransformation[] = [];
  #transformedNodes: {
    [key: string]: ISDObject
  } = {};
  #excludeViewers: string[] = [];
  #version: string;
  #visible: boolean = true;

  // #endregion Properties (10)

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
    name: string = 'node',
    parent: TreeNode | null = null,
    data: ITreeNodeData[] = [],
    transformations: ITransformation[] = []
  ) {
    this.#name = name.replace(/\./g, "_");
    this.#parent = parent;
    this.#data = data;
    this.#transformations = transformations;

    this.#id = this.#uuidGenerator.create();
    this.#version = this.#uuidGenerator.create();
    this.#parent?.addChild(this);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (14)

  public get boundingBox(): Box {
    return this.#boundingBox;
  }

  public set boundingBox(value: Box) {
    this.#boundingBox = value;
  }

  public get children(): TreeNode[] {
    return this.#children;
  }

  public get data(): ITreeNodeData[] {
    return this.#data;
  }
  
  public get excludeViewers(): string[] {
    return this.#excludeViewers;
  }

  public set excludeViewers(value: string[]) {
    this.#excludeViewers = value;
  }

  public get id(): string {
    return this.#id;
  }

  public set id(value: string) {
    this.#id = value;
  }

  public get name(): string {
    return this.#name;
  }

  public get nodeMatrix(): mat4 {
    const matrix: mat4 = mat4.create();
    for (let transform of this.#transformations)
      if(transform.id !== 'sdtf') mat4.multiply(matrix, matrix, transform.matrix);
    return matrix;
  }

  public get nodeMatrixSDTF(): mat4 {
    const matrix: mat4 = mat4.create();
    for (let transform of this.#transformations)
      mat4.multiply(matrix, matrix, transform.matrix);
    return matrix;
  }

  public get parent(): TreeNode | null {
    return this.#parent;
  }

  public set parent(value: TreeNode | null) {
    // check if it was removed from previous parent
    if (value === null && this.#parent !== null)
      this.#parent.removeChild(this);

    // check if it is in children of new parent
    if (value !== null)
      value.addChild(this);

    this.#parent = value;
  }

  public get transformations(): ITransformation[] {
    return this.#transformations;
  }

  public set transformations(value: ITransformation[]) {
    this.#transformations = value;
    this.updateVersion();
  }

  public get transformedNodes(): {
    [key: string]: ISDObject
  } {
    return this.#transformedNodes;
  }

  public set transformedNodes(value: {
    [key: string]: ISDObject
  }) {
    this.#transformedNodes = value;
  }

  public get version(): string {
    return this.#version;
  }

  public get visible(): boolean {
    return this.#visible;
  }
  
  public set visible(value: boolean) {
    this.#visible = value;
    this.updateVersion();
  }

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

  // #endregion Public Accessors (14)

  // #region Public Methods (9)

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
    clone.visible = this.visible;
    for (let child of this.#children)
      clone.addChild(child.clone());
    for (let data of this.#data)
      clone.data.push(data.clone());
    for (let transform of this.#transformations)
      clone.transformations.push({
        id: transform.id,
        matrix: mat4.clone(transform.matrix)
      });

    return clone;
  }

  /**
   * Clones this node and all its children.
   */
  public cloneInstance(): TreeNode {
    const clone = new TreeNode(this.name);
    clone.visible = this.visible;
    for (let child of this.#children)
      clone.addChild(child.cloneInstance());
    for (let data of this.#data)
      clone.data.push(data);
    for (let transform of this.#transformations)
      clone.transformations.push({
        id: transform.id,
        matrix: mat4.clone(transform.matrix)
      });

    return clone;
  }

  /**
   * Returns the child with the specified id
   * @return {TreeNode}
   */
  public getChild(id: string): TreeNode | null {
    for (let i = 0; i < this.#children.length; i++)
      if (this.#children[i].id === id)
        return this.#children[i];
    return null;
  }

  /**
   * Return the path to this node.
   */
  public getPath(): string {
    let path = this.name;
    let node: TreeNode | null = this.parent;
    while (node) {
      path = node.name + '.' + path;
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

    for (let i = 0; i < this.#children.length; i++)
      this.#children[i].updateVersion();

    this.#version = this.#uuidGenerator.create();
  }

  /**
   * Only updates the version of this node.
   */
  public updateVersionAtomic(): void {
    this.#version = this.#uuidGenerator.create();
  }

  // #endregion Public Methods (9)
}