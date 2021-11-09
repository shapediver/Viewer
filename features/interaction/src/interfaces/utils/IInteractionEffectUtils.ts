import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { MaterialData } from "@shapediver/viewer.shared.types";

export interface IInteractionEffectUtils {
    // #region Public Methods (2)

    applyEffectMaterial(node: TreeNode, material: MaterialData): string;
    removeEffectMaterial(node: TreeNode, token: string): void;

    // #endregion Public Methods (2)
}