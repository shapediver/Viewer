import { vec3 } from "gl-matrix";
import { SDTFAttributeOverview, SDTFItemData } from "@shapediver/viewer.shared.types";
import { IViewer } from "./IViewer";
import { SDTFAttributeVisualizationData } from "@shapediver/viewer.rendering-engine-threejs.attributes";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IAttributeViewer extends IViewer {
    visualizationAttributes: { [key: string]: boolean };
    convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, attributes: SDTFAttributeOverview, visualizationAttributes: { [key: string]: boolean; }) => SDTFAttributeVisualizationData) | undefined;
    createSDTFAttributeOverview(node: TreeNode): SDTFAttributeOverview;
}
