import { vec3 } from "gl-matrix";
import { SDTFAttributeVisualizationData, SDTFItemData, SDTFOverview } from "@shapediver/viewer.shared.types";
import { IViewer } from "./IViewer";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IAttributeViewer extends IViewer {
    visualizationAttributes: { [key: string]: boolean };

    /**
     * Provide a callback that transforms a {@link SDTFItemData} to a {@link SDTFAttributeVisualizationData}.
     * The {@link SDTFOverview} provides general information like min and max values for numbers or the available options for strings.
     * The {@link visualizationAttributes} provide the current selected attributes. These can be used to only show some attributes at a time, but can be ignored as well.
     */
    convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }) => SDTFAttributeVisualizationData) | undefined;
    
    /**
     * Create the {@link SDTFOverview} for the provided node.
     * If no node was provided, the scene root is used instead.
     * 
     * @param node 
     */
    createSDTFOverview(node: TreeNode): SDTFOverview;
}
