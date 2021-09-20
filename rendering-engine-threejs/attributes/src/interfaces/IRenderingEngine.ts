import { IRenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { SDTFItemData, SDTFOverview } from "@shapediver/viewer.shared.types";
import { SDTFAttributeVisualizationData } from "../managers/SceneTreeManager";

export interface IRenderingEngineAttributes extends IRenderingEngine {
    visualizationAttributes: { [key: string]: boolean };
    convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }) => SDTFAttributeVisualizationData) | undefined;
    createSDTFOverview(node: TreeNode): SDTFOverview;
}