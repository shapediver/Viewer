import { mat4 } from 'gl-matrix'
import { IBox } from '@shapediver/viewer.shared.math'
import { ITreeNodeData } from './ITreeNodeData'

export interface ITransformation {
    // #region Properties (2)

    id: string,
    matrix: mat4

    // #endregion Properties (2)
}

export interface ITreeNode<T extends ITreeNode<any, ITreeNodeData<any>>, U extends ITreeNodeData<any>> {
    // #region Properties (17)

    /**
     * The bounding box of this tree node.
     */
    readonly boundingBox: IBox;
    /**
     * The bounding box of this tree node for each viewport.
     * As there can be properties where tree nodes are excluded from the viewport, the bounding boxes may be different per viewport.
     * The {@link boundingBox} property can be used as the general bounding box without any viewport specific exclusions.
     */
     readonly boundingBoxViewport: { [key: string]: IBox };
    /**
     * The children of this tree node. Can be added and remove via {@link addChild} and {@link removeChild}. 
     */
    readonly children: T[];
    /**
     * The data of this tree node. 
     * The data can include Geometry, Materials, Lights, Cameras, but also informational or custom data.
     * 
     * Can be added and remove via {@link addData} and {@link removeData}. 
     */
    readonly data: U[];
    /**
     * The ID of the tree node.
     */
    readonly id: string;
    /**
     * The name of the tree node.
     */
    readonly name: string;
    /**
     * The matrix of the tree node.
     * This is computed via all transformations in the {@link transformations} property.
     */
    readonly nodeMatrix: mat4;
    /**
     * The original ID of the tree node, if it was copied.
     */
    readonly originalId: string;
    /**
     * The parent of the tree node.
     * This property is automatically managed by {@link addChild} and {@link removeChild}. 
     */
    readonly parent?: T;
    /**
     * The version of the tree node.
     * If the version changes, the node will be marked for an update.
     * A version change can be triggered via {@link updateVersion}. 
     */
    readonly version: string;
    /**
     * The world matrix of the tree node.
     * This includes also the transformations of all parents.
     */
    readonly worldMatrix: mat4;

    /**
     * The inverse matrices for the bones, if specified.
     */
    boneInverses: mat4[];
    /**
     * The optional bones that build a skeleton for animations.
     */
    bones: T[];
    /**
     * The viewports to exclude this tree node from.
     */
    excludeViewports: string[];
    /**
     * The viewports to restrict this tree node to.
     */
    restrictViewports: string[];
    /**
     * Property to mark this node as a skin node. (default: false)
     */
    skinNode: boolean;
    /**
     * The transformation to be applied to this tree node.
     */
    transformations: ITransformation[];
    /**
     * Option to make this tree node visible. (default: true)
     */
    visible: boolean;

    // #endregion Properties (17)

    // #region Public Methods (17)

    /**
     * Add a child to the children of this node.
     * 
     * @param child the child to add
     */
    addChild(child: T): boolean;
    /**
     * Add a data item to node.
     * 
     * @param data the data to add
     */
    addData(data: U): boolean;
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
    clone(): T;
    /**
     * Clones this node and all its children. 
     * The data objects like GeometryData, MaterialData, etc. are not copied in this case.
     */
    cloneInstance(): T;
    /**
     * Returns the child with the specified id
    */
    getChild(id: string): T | undefined;
    /**
     * Returns the data item with the specified id
    */
    getData(id: string): U | undefined;
    /**
     * Return the path to this node.
     */
    getPath(): string;
    /**
     * Returns the transformation with the specified id
    */
    getTransformation(id: string): ITransformation | undefined;
    /**
     * Check for existence of a child from the children of this node.
     * 
     * @param child the child to check
     */
    hasChild(child: T): boolean;
    /**
     * Check for existence of a data item of this node.
     * 
     * @param data the data item to check
     */
    hasData(data: U): boolean;
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
    removeChild(child: T): boolean;
    /**
     * Remove a data item from this node.
     * 
     * @param data the data to remove
     */
    removeData(data: U): boolean;
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
    traverse(callback: (node: T) => void): void;
    /**
     * Update the version.
     */
    updateVersion(): void;

    // #endregion Public Methods (17)
}