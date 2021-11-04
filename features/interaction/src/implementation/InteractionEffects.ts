import { singleton } from "tsyringe";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, MaterialData } from "@shapediver/viewer.shared.types";

@singleton()
export class InteractionEffects {
    // #region Public Methods (2)

    public applyEffect(node: TreeNode, material: MaterialData) {
        const applyEffect = (node: TreeNode) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData = <GeometryData>node.data[i];
                    geometryData.primitive.effectMaterials.push(material);
                }
            }

            for (let i = 0; i < node.children.length; i++) {
                applyEffect(node.children[i])
            }
        }
        applyEffect(node);
        node.updateVersion();
    }

    public removeEffect(node: TreeNode, material: MaterialData) {
        const removeEffect = (node: TreeNode) => {
            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData = <GeometryData>node.data[i];
                    const index = geometryData.primitive.effectMaterials.findIndex(e => e.id === material.id); 
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