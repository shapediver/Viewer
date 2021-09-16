import { IRenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { SDTFAttributeOverview, SDTFItemData } from "@shapediver/viewer.shared.types";
import { SDTFAttributeVisualizationData } from "../managers/SceneTreeManager";

export interface IRenderingEngineAttributes extends IRenderingEngine {
    visualizationAttributes: { [key: string]: boolean };
    convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, overview: SDTFAttributeOverview) => SDTFAttributeVisualizationData) | undefined;
    createSDTFAttributeOverview(node: TreeNode): SDTFAttributeOverview;
}