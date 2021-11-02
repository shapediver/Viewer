import { container, singleton } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, MaterialData } from "@shapediver/viewer.shared.types";
import { IInteractionFilterOptions, IInteractionManager } from "../interfaces/IInteractionManager";

@singleton()
class Effects {
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

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (2)

    protected readonly _effects: Effects = <Effects>container.resolve(Effects);

    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (2)

    // #region Public Abstract Methods (3)

    abstract onDown(ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(ray: IRay, intersection: IIntersection[]): void;
    abstract onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Abstract Methods (3)
}