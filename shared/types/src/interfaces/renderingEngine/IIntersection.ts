import {ITreeNode} from "@shapediver/viewer.shared.node-tree";

import {vec3} from "gl-matrix";

import {IGeometryData} from "../data/IGeometryData";

export interface IBoxSelectionIntersection extends IIntersectionDefinition {
	/** The type of the intersection. */
	type: "BoxSelectionIntersection";
}

export interface IIntersectionDefinition {
	/** The intersected geometry data */
	geometryData?: IGeometryData;

	/** The intersected node. */
	node: ITreeNode;
	type: "BoxSelectionIntersection" | "RayTracingIntersection";
}

export interface IRayTracingIntersection extends IIntersectionDefinition {
	/** The distance to the intersection. */
	distance: number;

	/** The point of intersection. */
	point: vec3;

	/** The type of the intersection. */
	type: "RayTracingIntersection";
}
