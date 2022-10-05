import { mat4 } from 'gl-matrix'
import { IBox } from '@shapediver/viewer.shared.math'
import { ITreeNodeData } from './ITreeNodeData'

export interface ITransformation {
    // #region Properties (2)

    id: string,
    matrix: mat4

    // #endregion Properties (2)
}

export interface ITreeNode {
    // #region Properties (16)

    readonly children: ITreeNode[];
    readonly data: ITreeNodeData[];

    readonly id: string;
    readonly originalId: string;
    readonly name: string;
    readonly version: string;
    readonly parent?: ITreeNode;

    readonly nodeMatrix: mat4;
    readonly worldMatrix: mat4;

    readonly boundingBox: IBox;

    excludeViewports: string[];
    restrictViewports: string[];

    transformations: ITransformation[];
    visible: boolean;

    skinNode: boolean;
    bones: ITreeNode[];
    boneInverses: mat4[];

    // #endregion Properties (16)

    // #region Public Methods (13)

    /**
     * Add a child to the children of this node.
     * 
     * @param child the child to add
     */
    addChild(child: ITreeNode): boolean;

    /**
     * Add a data item to node.
     * 
     * @param data the data to add
     */
    addData(data: ITreeNodeData): boolean;

    /**
     * Add a transformation to this node.
     * 
     * @param transformation the transformation to add
     */
    addTransformation(transformation: ITransformation): boolean;

    /**
     * Clones this node and all its children. 
     * The data objects like GeometryData, MaterialData, etc. are cloned as well. 
     * Depending on the size of the node and the amount of children, this can therefore be relatively slow.
     */
    clone(): ITreeNode;

    /**
     * Clones this node and all its children. 
     * The data objects like GeometryData, MaterialData, etc. are not copied in this case.
     */
    cloneInstance(): ITreeNode;

    /**
     * Returns the child with the specified id
    */
    getChild(id: string): ITreeNode | undefined;

    /**
     * Returns the data item with the specified id
    */
    getData(id: string): ITreeNodeData | undefined;

    /**
     * Returns the transformation with the specified id
    */
    getTransformation(id: string): ITransformation | undefined;

    /**
     * Return the path to this node.
     */
    getPath(): string;

    /**
     * Check for existence of a child from the children of this node.
     * 
     * @param child the child to check
     */
    hasChild(child: ITreeNode): boolean;

    /**
     * Check for existence of a data item of this node.
     * 
     * @param data the data item to check
     */
    hasData(data: ITreeNodeData): boolean;

    /**
     * Check for existence of a transformation of this node.
     * 
     * @param data the transformation to check
     */
    hasTransformation(transformation: ITransformation): boolean;

    /**
     * Remove a child from the children of this node.
     * 
     * @param child the child to remove
     */
    removeChild(child: ITreeNode): boolean;

    /**
     * Remove a data item from this node.
     * 
     * @param data the data to remove
     */
    removeData(data: ITreeNodeData): boolean;

    /**
     * Remove a transformation from this node.
     * 
     * @param transformation the transformation to remove
     */
    removeTransformation(transformation: ITransformation): boolean;

    /**
     * Traverse this node and all it's children and executes the callback for all of them
     * 
     * @param callback 
     */
    traverse(callback: (node: ITreeNode) => void): void;

    /**
     * Update the version
     */
    updateVersion(): void;

    // #endregion Public Methods (13)
}