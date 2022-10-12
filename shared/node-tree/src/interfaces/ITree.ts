import { ITreeNode } from "./ITreeNode";
import { ITreeNodeData } from "./ITreeNodeData";

export interface ITree<T extends ITreeNode<any, ITreeNodeData<any>>> {
    // #region Properties (1)

    /**
     * The root of the tree.
     */
    readonly root: T;

    // #endregion Properties (1)

    // #region Public Methods (5)

    /**
     * Add the node as a child of the corresponding parent node.
     * 
     * @param node the node to be added
     * @param parent the targeted parent node
     * @param root optional root at which the process begins, root node will be used per default
     */
    addNode(node: T, parent?: T, root?: T): boolean;

    /**
     * Add the node at the corresponding path. (paths are dot separated ids)
     * 
     * @param node the node to be added
     * @param path the path at which the node should be added
     * @param root optional root at which the process begins, root node will be used per default
     */
    addNodeAtPath(node: T, path?: string, root?: T): boolean;

    /**
     * Get the node at the provided path.
     * 
     * @param path 
     * @param root 
     * @returns 
     */
    getNodeAtPath(path?: string, root?: T): T | null;

    /**
     * Remove a node from the tree.
     * 
     * @param node the node to remove 
     * @param root optional root at which the process begins, root node will be used per default
     */
    removeNode(node: T, root?: T): boolean;

    /**
     * Remove a node via the path of it.
     * 
     * @param path the path of the node to be removed
     * @param root optional root at which the process begins, root node will be used per default
     */
    removeNodeAtPath(path: string, root?: T): boolean;

    // #endregion Public Methods (5)
}