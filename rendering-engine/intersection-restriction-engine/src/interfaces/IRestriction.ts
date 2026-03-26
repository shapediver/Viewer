import {mat4, vec3} from "gl-matrix";

import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {IRay} from "@shapediver/viewer.shared.types";
import {CameraPlaneRestrictionProperties} from "../implementation/restrictions/camera_plane/CameraPlaneRestriction";
import {GeometryRestrictionProperties} from "../implementation/restrictions/geometry/GeometryRestriction";
import {LineRestrictionProperties} from "../implementation/restrictions/line/LineRestriction";
import {PlaneRestrictionProperties} from "../implementation/restrictions/plane/PlaneRestriction";
import {PointRestrictionProperties} from "../implementation/restrictions/point/PointRestriction";
import {IDragAnchor} from "./IDragAnchor";
import {ISnapRestriction} from "./ISnapRestriction";

export enum RESTRICTION_TYPE {
	PLANE = "plane",
	GEOMETRY = "geometry",
	POINT = "point",
	LINE = "line",
	CAMERA_PLANE = "camera_plane",
}

export interface DraggingRestrictionMetaData extends RestrictionMetaData {
	dragAnchors?: IDragAnchor[];
	dragOrigin: vec3;
	node: ITreeNode;
	type: "dragging";
}

export interface DrawingRestrictionMetaData extends RestrictionMetaData {
	index?: number;
	positionArray?: Float32Array;
	type: "drawing";
}

export interface TransformationToolsRestrictionMetaData
	extends RestrictionMetaData {
	type: "transformation-tools";
}

export interface IRestriction {
	readonly id: string;
	readonly priority: number;
	readonly snapRestrictions: {[key: string]: ISnapRestriction};
	readonly type: RESTRICTION_TYPE;

	enabled: boolean;
	hideable: boolean;
	rotation: {
		axis: vec3;
		angle: number;
	};
	showVisualization: boolean;

	/**
	 * Ray trace the restriction.
	 * If the ray does not intersect the restriction, the method returns undefined.
	 *
	 * @param ray The ray to trace.
	 * @param metaData The meta data of the ray.
	 * @returns The intersection point of the ray with the restriction.
	 */
	rayTrace(
		ray: IRay,
		metaData?: RestrictionMetaData,
	): RestrictionResult | undefined;

	/**
	 * Remove the visualization of the restriction.
	 */
	removeVisualization(): void;
}

/* eslint-disable @typescript-eslint/ban-types */
export interface RestrictionMetaData {
	pressedKeys?: string[];
	toggledKeys?: string[];
	startPoint?: vec3;
	type: "drawing" | "dragging" | "transformation-tools";
}

export interface RestrictionPropertiesBase {
	/**
	 * Whether to create visual helper objects (grid, axis, etc.) for restrictions. (default: true)
	 */
	createHelperObjects?: boolean;

	/**
	 * If the restriction should be hidden by geometry in front of it. (default: false)
	 */
	hideable?: boolean;

	/**
	 * The id of the restriction.
	 */
	id?: string;

	/**
	 * The priority of the restriction.
	 */
	priority?: number;

	/**
	 * The rotation of the object after the restriction is applied.
	 */
	rotation?: {
		axis: vec3;
		angle: number;
	};

	/**
	 * Type of the restriction
	 */
	type: RESTRICTION_TYPE;
}

export type RayTraceResult = {
	distance?: number;
	distanceSquared?: number;
	dragAnchor?: IDragAnchor;
	point: vec3;
	closestPointOnRay?: vec3;
	restriction: IRestriction;
	transformation?: mat4;
	restrictionResult: RestrictionResult;
};

export type RestrictionProperties =
	| PointRestrictionProperties
	| PlaneRestrictionProperties
	| LineRestrictionProperties
	| GeometryRestrictionProperties
	| CameraPlaneRestrictionProperties;

export type RestrictionResult = {
	closestIntersectionPoint: vec3;
	distanceOriginToClosestIntersectionPointSquared: number;
	targetPoint: vec3;
	distanceClosestPointToTargetPointSquared: number;
	restriction: IRestriction;
	snapRestriction?: ISnapRestriction;
	restrictionIntersectionData?: unknown;
};

export const isDraggingRestriction = (
	metaData?: RestrictionMetaData,
): metaData is DraggingRestrictionMetaData => {
	return metaData?.type === "dragging";
};
export const isDrawingRestriction = (
	metaData?: RestrictionMetaData,
): metaData is DrawingRestrictionMetaData => {
	return metaData?.type === "drawing";
};
export const isTransformationToolsRestriction = (
	metaData?: RestrictionMetaData,
): metaData is TransformationToolsRestrictionMetaData => {
	return metaData?.type === "transformation-tools";
};
