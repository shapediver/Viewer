import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IGeometryData } from '../data/IGeometryData';

export interface IIntersectionFilter {
    (node: ITreeNode, geometryData?: IGeometryData): boolean;
}
