import { mat4 } from 'gl-matrix'
import { IBox } from '@shapediver/viewer.shared.math'
import { ITreeNodeData } from './ITreeNodeData'
import { ISDObject } from './ISDObject'

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
    readonly name: string;
    readonly nodeMatrix: mat4;
    readonly nodeMatrixSDTF: mat4;
    readonly version: string;
    readonly worldMatrix: mat4;

    bone: boolean
    boundingBox: IBox
    excludeViewers: string[];
    includeViewers: string[];
    parent: ITreeNode | null;
    transformations: ITransformation[];
    transformedNodes: {
        [key: string]: ISDObject
    };
    visible: boolean;

    // #endregion Properties (16)

    // #region Public Methods (9)

    /**
     * Add a child from the children of this node.
     * 
     * @param child the child to add
     */
    addChild(child: ITreeNode): boolean;
    /**
     * Clones this node and all its children.
     */
    clone(): ITreeNode;
    /**
     * Clones this node and all its children.
     */
    cloneInstance(): ITreeNode;
    /**
     * Returns the child with the specified id
     * @return {ITreeNode}
    */
    getChild(id: string): ITreeNode | null;
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
     * Remove a child from the children of this node.
     * 
     * @param child the child to remove
     */
    removeChild(child: ITreeNode): boolean;
    /**
     * Update the version
     */
    updateVersion(): void;
    /**
     * Only updates the version of this node.
     */
    updateVersionAtomic(): void;

    // #endregion Public Methods (9)
}