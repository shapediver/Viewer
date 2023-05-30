import { vec3 } from "gl-matrix";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { IGeometryData } from "@shapediver/viewer.shared.types";

export interface IIntersection {
    /** The distance to the intersection. */
    distance: number,
    /** The point of intersection. */
    point: vec3,
    /** The intersected node. */
    node: ITreeNode
    /** The intersected geometry data */
    geometryData?: IGeometryData
}