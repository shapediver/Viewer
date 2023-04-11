import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, IMaterialAbstractData } from "@shapediver/viewer.shared.types";
import { UuidGenerator } from "@shapediver/viewer.shared.services";
import { IInteractionEffectUtils } from "../../interfaces/utils/IInteractionEffectUtils";

export class InteractionEffectUtils implements IInteractionEffectUtils {
    // #region Properties (2)

    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

    private static _instance: InteractionEffectUtils;

    // #endregion Properties (2)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (2)

    /**
     * Apply the effect material to the node and all descendents.
     * 
     * @param node 
     * @param material 
     * @returns 
     */
    public applyEffectMaterial(node: ITreeNode, material: IMaterialAbstractData): string {
        const token = this.#uuidGenerator.create();

        const applyEffect = (node: ITreeNode) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData = <GeometryData>node.data[i];
                    geometryData.primitive.effectMaterials.push({material, token});
                }
            }

            for (let i = 0; i < node.children.length; i++) {
                applyEffect(node.children[i])
            }
        }
        applyEffect(node);
        return token;
    }

    /**
     * Remove the effect material with the specified token from the node and all descendents.
     * 
     * @param node 
     * @param token 
     */
    public removeEffectMaterial(node: ITreeNode, token: string) {
        const removeEffect = (node: ITreeNode) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData = <GeometryData>node.data[i];
                    const index = geometryData.primitive.effectMaterials.findIndex(e => e.token === token); 
                    if(index !== -1) geometryData.primitive.effectMaterials.splice(index, 1);
                }
            }

            for (let i = 0; i < node.children.length; i++) {
                removeEffect(node.children[i])
            }
        }
        removeEffect(node);
    }

    // #endregion Public Methods (2)
}