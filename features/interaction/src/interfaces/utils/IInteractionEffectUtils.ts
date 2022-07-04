import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IMaterialAbstractData } from "@shapediver/viewer.shared.types";

export interface IInteractionEffectUtils {
    // #region Public Methods (2)

    /**
     * Apply an effect material all geometry in the current node.
     * The material provided will be used for this effect.
     * The returned token can be used to removed the effect.
     * 
     * @param node 
     * @param material 
     * @returns
     */
    applyEffectMaterial(node: ITreeNode, material: IMaterialAbstractData): string;
    /**
     * Remove an effect material with the token provided wen adding it.
     * 
     * @param node 
     * @param token 
     */
    removeEffectMaterial(node: ITreeNode, token: string): void;

    // #endregion Public Methods (2)
}