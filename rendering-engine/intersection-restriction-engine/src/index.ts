import {type IVisualizationSettings} from "@shapediver/viewer.shared.types";
import {CameraPlaneRestrictionApi} from "./api/implementation/camera_plane/CameraPlaneRestrictionApi";
import {GeometryRestrictionApi} from "./api/implementation/geometry/GeometryRestrictionApi";
import {LineRestrictionApi} from "./api/implementation/line/LineRestrictionApi";
import {PlaneRestrictionApi} from "./api/implementation/plane/PlaneRestrictionApi";
import {AngularRestrictionApi} from "./api/implementation/plane/snap/AngularRestrictionApi";
import {AxisRestrictionApi} from "./api/implementation/plane/snap/AxisRestrictionApi";
import {GridRestrictionApi} from "./api/implementation/plane/snap/GridRestrictionApi";
import {PointRestrictionApi} from "./api/implementation/point/PointRestrictionApi";
import {type IRestrictionApi} from "./api/interfaces/IRestrictionApi";
import {type ISnapRestrictionApi} from "./api/interfaces/ISnapRestrictionApi";
import {EventManager} from "./implementation/EventManager";
import {GeometryMathManager} from "./implementation/GeometryMathManager";
import {RestrictionManager} from "./implementation/RestrictionManager";
import {
	CameraPlaneRestriction,
	type CameraPlaneRestrictionProperties} from "./implementation/restrictions/camera_plane/CameraPlaneRestriction";
import {
	GeometryRestriction,
	type GeometryRestrictionProperties} from "./implementation/restrictions/geometry/GeometryRestriction";
import {
	LineRestriction,
	type LineRestrictionProperties} from "./implementation/restrictions/line/LineRestriction";
import {
	PlaneRestriction,
	type PlaneRestrictionProperties} from "./implementation/restrictions/plane/PlaneRestriction";
import {type AngularRestrictionProperties} from "./implementation/restrictions/plane/snap/AngularRestriction";
import {type AxisRestrictionProperties} from "./implementation/restrictions/plane/snap/AxisRestriction";
import {type GridRestrictionProperties} from "./implementation/restrictions/plane/snap/GridRestriction";
import {
	PointRestriction,
	type PointRestrictionProperties} from "./implementation/restrictions/point/PointRestriction";
import {type IDragAnchor} from "./interfaces/IDragAnchor";
import {
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	type IRestriction,
	type RayTraceResult,
	RESTRICTION_TYPE,
	type RestrictionMetaData,
	type RestrictionProperties,
	type RestrictionPropertiesBase} from "./interfaces/IRestriction";
import {type IRestrictionManager} from "./interfaces/IRestrictionManager";
import {
	type ISnapRestriction,
	type SnapRestrictionProperties} from "./interfaces/ISnapRestriction";

export {AngularRestrictionApi,
	AxisRestrictionApi,
	CameraPlaneRestriction,
	CameraPlaneRestrictionApi,
	EventManager,
	GeometryMathManager,
	GeometryRestriction,
	GeometryRestrictionApi,
	GridRestrictionApi,
	LineRestriction,
	LineRestrictionApi,
	PlaneRestriction,
	PlaneRestrictionApi,
	PointRestriction,
	PointRestrictionApi,
	RESTRICTION_TYPE,
	RestrictionManager};
export type {AngularRestrictionProperties,
	AxisRestrictionProperties,
	CameraPlaneRestrictionProperties,
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	GeometryRestrictionProperties,
	GridRestrictionProperties,
	IDragAnchor,
	IRestriction,
	IRestrictionApi,
	IRestrictionManager,
	ISnapRestriction,
	ISnapRestrictionApi,
	IVisualizationSettings,
	LineRestrictionProperties,
	PlaneRestrictionProperties,
	PointRestrictionProperties,
	RayTraceResult,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	SnapRestrictionProperties};
