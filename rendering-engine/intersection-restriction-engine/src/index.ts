import {IVisualizationSettings} from "@shapediver/viewer.shared.types";
import {CameraPlaneRestrictionApi} from "./api/implementation/camera_plane/CameraPlaneRestrictionApi";
import {GeometryRestrictionApi} from "./api/implementation/geometry/GeometryRestrictionApi";
import {LineRestrictionApi} from "./api/implementation/line/LineRestrictionApi";
import {PlaneRestrictionApi} from "./api/implementation/plane/PlaneRestrictionApi";
import {AngularRestrictionApi} from "./api/implementation/plane/snap/AngularRestrictionApi";
import {AxisRestrictionApi} from "./api/implementation/plane/snap/AxisRestrictionApi";
import {GridRestrictionApi} from "./api/implementation/plane/snap/GridRestrictionApi";
import {PointRestrictionApi} from "./api/implementation/point/PointRestrictionApi";
import {IRestrictionApi} from "./api/interfaces/IRestrictionApi";
import {ISnapRestrictionApi} from "./api/interfaces/ISnapRestrictionApi";
import {EventManager} from "./implementation/EventManager";
import {GeometryMathManager} from "./implementation/GeometryMathManager";
import {RestrictionManager} from "./implementation/RestrictionManager";
import {
	CameraPlaneRestriction,
	CameraPlaneRestrictionProperties,
} from "./implementation/restrictions/camera_plane/CameraPlaneRestriction";
import {
	GeometryRestriction,
	GeometryRestrictionProperties,
} from "./implementation/restrictions/geometry/GeometryRestriction";
import {
	LineRestriction,
	LineRestrictionProperties,
} from "./implementation/restrictions/line/LineRestriction";
import {
	PlaneRestriction,
	PlaneRestrictionProperties,
} from "./implementation/restrictions/plane/PlaneRestriction";
import {AngularRestrictionProperties} from "./implementation/restrictions/plane/snap/AngularRestriction";
import {AxisRestrictionProperties} from "./implementation/restrictions/plane/snap/AxisRestriction";
import {GridRestrictionProperties} from "./implementation/restrictions/plane/snap/GridRestriction";
import {
	PointRestriction,
	PointRestrictionProperties,
} from "./implementation/restrictions/point/PointRestriction";
import {IDragAnchor} from "./interfaces/IDragAnchor";
import {
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	IRestriction,
	RayTraceResult,
	RESTRICTION_TYPE,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
} from "./interfaces/IRestriction";
import {IRestrictionManager} from "./interfaces/IRestrictionManager";
import {
	ISnapRestriction,
	SnapRestrictionProperties,
} from "./interfaces/ISnapRestriction";

export {
	AngularRestrictionApi,
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
	RestrictionManager,
	type AngularRestrictionProperties,
	type AxisRestrictionProperties,
	type CameraPlaneRestrictionProperties,
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	type GeometryRestrictionProperties,
	type GridRestrictionProperties,
	type IDragAnchor,
	type IRestriction,
	type IRestrictionApi,
	type IRestrictionManager,
	type ISnapRestriction,
	type ISnapRestrictionApi,
	type IVisualizationSettings,
	type LineRestrictionProperties,
	type PlaneRestrictionProperties,
	type PointRestrictionProperties,
	type RayTraceResult,
	type RestrictionMetaData,
	type RestrictionProperties,
	type RestrictionPropertiesBase,
	type SnapRestrictionProperties,
};
