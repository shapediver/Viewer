import {type IGeometryData} from "../data/IGeometryData";
import {type ITreeNode} from "../tree-node/ITreeNode";

export interface IIntersectionFilter {
	(node: ITreeNode, geometryData?: IGeometryData): boolean;
}
