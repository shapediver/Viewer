import { container, singleton } from "tsyringe";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, AbstractMaterialData } from "@shapediver/viewer.shared.types";
import { UuidGenerator } from "@shapediver/viewer.shared.services";
import { IInteractionEffectUtils } from "../../interfaces/utils/IInteractionEffectUtils";

@singleton()
export class InteractionEffectUtils implements IInteractionEffectUtils {
    // #region Properties (1)

    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (1)

    // #region Public Methods (2)

    public applyEffectMaterial(node: TreeNode, material: AbstractMaterialData): string {
        const token = this.#uuidGenerator.create();

        const applyEffect = (node: TreeNode) => {
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
        node.updateVersion();
        return token;
    }

    public removeEffectMaterial(node: TreeNode, token: string) {
        const removeEffect = (node: TreeNode) => {
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
        node.updateVersion();
    }

    // #endregion Public Methods (2)
}