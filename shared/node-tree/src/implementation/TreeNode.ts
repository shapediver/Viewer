import { mat4 } from 'gl-matrix'
import { container } from 'tsyringe'
import { UuidGenerator } from '@shapediver/viewer.shared.services'
import { Box, IBox } from '@shapediver/viewer.shared.math'

import { ITransformation, ITreeNode } from '../interfaces/ITreeNode'
import { ITreeNodeData } from '../interfaces/ITreeNodeData'
import { ISDObject } from '../interfaces/ISDObject'

export class TreeNode implements ITreeNode {
  // #region Properties (13)

  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

  readonly #children: ITreeNode[] = [];
  readonly #data: ITreeNodeData[] = [];
  #transformations: ITransformation[] = [];

  readonly #id: string;
  readonly #name: string = '';
  #version: string;
  #parent?: ITreeNode;

  readonly #boundingBox: IBox = new Box();
  readonly #transformedNodes: {
    [key: string]: ISDObject
  } = {};

  #excludeViewports: string[] = [];
  #restrictViewports: string[] = [];

  #visible: boolean = true;

  // #endregion Properties (13)

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
    parent?: ITreeNode,
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

  // #region Public Accessors (19)

  public get boundingBox(): IBox {
    return this.#boundingBox;
  }

  public get children(): ITreeNode[] {
    return this.#children;
  }

  public get data(): ITreeNodeData[] {
    return this.#data;
  }

  public get excludeViewports(): string[] {
    return this.#excludeViewports;
  }

  public set excludeViewports(value: string[]) {
    this.#excludeViewports = value;
    this.updateVersion();
  }

  public get id(): string {
    return this.#id;
  }

  public get name(): string {
    return this.#name;
  }

  public get nodeMatrix(): mat4 {
    const matrix: mat4 = mat4.create();
    for (let transform of this.#transformations)
      if (transform.id !== 'sdtf') mat4.multiply(matrix, matrix, transform.matrix);
    return matrix;
  }

  public get parent(): ITreeNode | undefined {
    return this.#parent;
  }

  public set parent(value: ITreeNode | undefined) {
    // check if it was removed from previous parent
    if (this.#parent)
      this.#parent.removeChild(this);

    // check if it is in children of new parent
    if (value)
      value.addChild(this);

    this.#parent = value;
  }

  public get restrictViewports(): string[] {
    return this.#restrictViewports;
  }

  public set restrictViewports(value: string[]) {
    this.#restrictViewports = value;
    this.updateVersion();
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

  public get version(): string {
    return this.#version;
  }

  public set version(value: string) {
    this.#version = value;
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

    let node: ITreeNode = this;
    while (node.parent) {
      mat4.multiply(matrix, node.parent.nodeMatrix, matrix);
      node = node.parent;
    }

    return matrix;
  }

  // #endregion Public Accessors (19)

  // #region Public Methods (16)

  public addChild(child: ITreeNode): boolean {
    if (this.hasChild(child)) return false;

    this.#children.push(child);
    if (child.parent)
      child.parent.removeChild(child);
    (<ITreeNode | undefined>child.parent) = this;
    this.updateVersion();
    return true;
  }

  public addData(data: ITreeNodeData): boolean {
    this.#data.push(data);
    this.updateVersion();
    return true;
  }

  public addTransformation(transformation: ITransformation): boolean {
    this.#transformations.push(transformation);
    this.updateVersion();
    return true;
  }

  public clone(): ITreeNode {
    const clone = new TreeNode(this.name);
    clone.visible = this.visible;
    for (let child of this.#children)
      clone.addChild(child.clone());
    for (let data of this.#data)
      clone.data.push(data.clone());
    for (let transform of this.#transformations)
      clone.addTransformation({
        id: transform.id,
        matrix: mat4.clone(transform.matrix)
      });

    return clone;
  }

  public cloneInstance(): ITreeNode {
    const clone = new TreeNode(this.name);
    clone.visible = this.visible;
    for (let child of this.#children)
      clone.addChild(child.cloneInstance());
    for (let data of this.#data)
      clone.data.push(data);
    for (let transform of this.#transformations)
      clone.addTransformation({
        id: transform.id,
        matrix: mat4.clone(transform.matrix)
      });

    return clone;
  }

  public getChild(id: string): ITreeNode | undefined {
    for (let i = 0; i < this.#children.length; i++)
      if (this.#children[i].id === id)
        return this.#children[i];
    return;
  }

  public getData(id: string): ITreeNodeData | undefined {
    for (let i = 0; i < this.#data.length; i++)
      if (this.#data[i].id === id)
        return this.#data[i];
    return;
  }

  public getPath(): string {
    let path = this.name;
    let node: ITreeNode | undefined = this.parent;
    while (node) {
      path = node.name + '.' + path;
      node = node.parent;
    }
    return path;
  }

  public getTransformation(id: string): ITransformation | undefined {
    for (let i = 0; i < this.#transformations.length; i++)
      if (this.#transformations[i].id === id)
        return this.#transformations[i];
    return;
  }

  public hasChild(child: ITreeNode): boolean {
    return this.#children.includes(child);
  }

  public hasData(data: ITreeNodeData): boolean {
    return this.#data.includes(data);
  }

  public hasTransformation(transformation: ITransformation): boolean {
    return this.#transformations.includes(transformation);
  }

  public removeChild(child: ITreeNode): boolean {
    const index = this.#children.indexOf(child);
    if (index === -1) return false;
    this.#children.splice(index, 1);
    (<ITreeNode | undefined>child.parent) = undefined;
    this.updateVersion();
    return true;
  }

  public removeData(data: ITreeNodeData): boolean {
    const index = this.#data.indexOf(data);
    if (index === -1) return false;
    this.#data.splice(index, 1);
    this.updateVersion();
    return true;
  }

  public removeTransformation(transformation: ITransformation): boolean {
    const index = this.#transformations.indexOf(transformation);
    if (index === -1) return false;
    this.#transformations.splice(index, 1);
    this.updateVersion();
    return true;
  }

  public updateVersion(): void {
    let node = <ITreeNode>this;
    while (node.parent) {
      node = node.parent;
      (<any>node.version) = this.#uuidGenerator.create();
    }

    for (let i = 0; i < this.#children.length; i++)
      this.#children[i].updateVersion();

    this.#version = this.#uuidGenerator.create();
  }

  // #endregion Public Methods (16)
}