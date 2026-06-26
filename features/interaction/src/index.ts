import {
	IAmbientLightApi,
	ICameraApi,
	IDirectionalLightApi,
	IHemisphereLightApi,
	ILightApi,
	ILightSceneApi,
	IOrthographicCameraApi,
	IPerspectiveCameraApi,
	IPointLightApi,
	ISpotLightApi,
	IViewportApi,
} from "@shapediver/viewer";
import {
	AngularRestrictionApi,
	AngularRestrictionProperties,
	AxisRestrictionApi,
	AxisRestrictionProperties,
	CameraPlaneRestrictionApi,
	CameraPlaneRestrictionProperties,
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	GeometryRestrictionApi,
	GeometryRestrictionProperties,
	GridRestrictionApi,
	GridRestrictionProperties,
	IRestriction,
	IRestrictionApi,
	ISnapRestriction,
	ISnapRestrictionApi,
	LineRestrictionApi,
	LineRestrictionProperties,
	PlaneRestrictionApi,
	PlaneRestrictionProperties,
	PointRestrictionApi,
	PointRestrictionProperties,
	RESTRICTION_TYPE,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	SnapRestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	IIntersectionDefinition,
	IIntersectionFilter,
	IRay,
	RestrictionDefinition,
} from "@shapediver/viewer.shared.types";
import {AbstractInteractionManager} from "./implementation/AbstractInteractionManager";
import {CameraPlaneConstraint} from "./implementation/dragConstraints/CameraPlaneConstraint";
import {LineConstraint} from "./implementation/dragConstraints/LineConstraint";
import {PlaneConstraint} from "./implementation/dragConstraints/PlaneConstraint";
import {PointConstraint} from "./implementation/dragConstraints/PointConstraint";
import {InteractionData} from "./implementation/InteractionData";
import {InteractionEngine} from "./implementation/InteractionEngine";
import {DragManager} from "./implementation/managers/DragManager";
import {HoverManager} from "./implementation/managers/HoverManager";
import {MultiSelectManager} from "./implementation/managers/MultiSelectManager";
import {SelectManager} from "./implementation/managers/SelectManager";
import {SelectOnUpManager} from "./implementation/managers/SelectOnUpManager";
import {
	addInteractionData,
	calculateCombinedDraggedNodes,
	checkNodeNameMatch,
	convertUserDefinedNameFilters,
	convertUserDefinedNameFiltersForInstances,
	gatherNodesForPattern,
	getInstanceNodeData,
	getNodeData,
	getNodeName,
	getNodesByName,
	isOnBlacklist,
	matchNodesWithPatterns,
	NodeNameFilterPattern,
	OutputNodeNameFilterPatterns,
} from "./implementation/utils/PatternUtils";
import {InteractionEventResponseMapping} from "./interfaces/events/EventResponseMapping";
import {IDragEvent} from "./interfaces/events/IDragEvent";
import {IHoverEvent} from "./interfaces/events/IHoverEvent";
import {IMultiSelectEvent} from "./interfaces/events/IMultiSelectEvent";
import {ISelectEvent} from "./interfaces/events/ISelectEvent";
import {
	IInteractionData,
	IInteractionTypes,
} from "./interfaces/IInteractionData";
import {
	IInteractionEngine,
	INTERACTION_STATE,
} from "./interfaces/IInteractionEngine";
import {
	IInteractionFilterOptions,
	IInteractionManager,
} from "./interfaces/IInteractionManager";
import {
	IInteractionEffect,
	IInteractionEffectUtils,
} from "./interfaces/utils/IInteractionEffectUtils";

export {
	AbstractInteractionManager,
	addInteractionData,
	AngularRestrictionApi,
	AxisRestrictionApi,
	calculateCombinedDraggedNodes,
	CameraPlaneConstraint,
	CameraPlaneRestrictionApi,
	checkNodeNameMatch,
	convertUserDefinedNameFilters,
	convertUserDefinedNameFiltersForInstances,
	DragManager,
	gatherNodesForPattern,
	GeometryRestrictionApi,
	getInstanceNodeData,
	getNodeData,
	getNodeName,
	getNodesByName,
	GridRestrictionApi,
	HoverManager,
	INTERACTION_STATE,
	InteractionData,
	InteractionEngine,
	isOnBlacklist,
	LineConstraint,
	LineRestrictionApi,
	matchNodesWithPatterns,
	MultiSelectManager,
	PlaneConstraint,
	PlaneRestrictionApi,
	PointConstraint,
	PointRestrictionApi,
	RESTRICTION_TYPE,
	SelectManager,
	SelectOnUpManager,
	type AngularRestrictionProperties,
	type AxisRestrictionProperties,
	type CameraPlaneRestrictionProperties,
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	type GeometryRestrictionProperties,
	type GridRestrictionProperties,
	type IAmbientLightApi,
	type ICameraApi,
	type IDirectionalLightApi,
	type IDragEvent,
	type IHemisphereLightApi,
	type IHoverEvent,
	type IInteractionData,
	type IInteractionEffect,
	type IInteractionEffectUtils,
	type IInteractionEngine,
	type IInteractionFilterOptions,
	type IInteractionManager,
	type IInteractionTypes,
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type ILightApi,
	type ILightSceneApi,
	type IMultiSelectEvent,
	type InteractionEventResponseMapping,
	type IOrthographicCameraApi,
	type IPerspectiveCameraApi,
	type IPointLightApi,
	type IRay,
	type IRestriction,
	type IRestrictionApi,
	type ISelectEvent,
	type ISnapRestriction,
	type ISnapRestrictionApi,
	type ISpotLightApi,
	type IViewportApi,
	type LineRestrictionProperties,
	type NodeNameFilterPattern,
	type OutputNodeNameFilterPatterns,
	type PlaneRestrictionProperties,
	type PointRestrictionProperties,
	type RestrictionDefinition,
	type RestrictionMetaData,
	type RestrictionProperties,
	type RestrictionPropertiesBase,
	type SnapRestrictionProperties,
};
