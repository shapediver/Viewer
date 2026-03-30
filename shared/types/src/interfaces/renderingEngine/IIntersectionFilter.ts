import {IGeometryData} from "../data/IGeometryData";
import {ITreeNode} from "../tree-node/ITreeNode";

export interface IIntersectionFilter {
	(node: ITreeNode, geometryData?: IGeometryData): boolean;
}
