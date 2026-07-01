import {
	type IAmbientLightApi,
	type ICameraApi,
	type IDirectionalLightApi,
	type IHemisphereLightApi,
	type ILightApi,
	type ILightSceneApi,
	type IOrthographicCameraApi,
	type IPerspectiveCameraApi,
	type IPointLightApi,
	type ISpotLightApi,
	type IViewportApi} from "@shapediver/viewer";
import {
	AngularRestrictionApi,
	type AngularRestrictionProperties,
	AxisRestrictionApi,
	type AxisRestrictionProperties,
	CameraPlaneRestrictionApi,
	type CameraPlaneRestrictionProperties,
	type DraggingRestrictionMetaData,
	type DrawingRestrictionMetaData,
	GeometryRestrictionApi,
	type GeometryRestrictionProperties,
	GridRestrictionApi,
	type GridRestrictionProperties,
	type IRestriction,
	type IRestrictionApi,
	type ISnapRestriction,
	type ISnapRestrictionApi,
	LineRestrictionApi,
	type LineRestrictionProperties,
	PlaneRestrictionApi,
	type PlaneRestrictionProperties,
	PointRestrictionApi,
	type PointRestrictionProperties,
	RESTRICTION_TYPE,
	type RestrictionMetaData,
	type RestrictionProperties,
	type RestrictionPropertiesBase,
	type SnapRestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type IRay,
	type RestrictionDefinition} from "@shapediver/viewer.shared.types";
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
	type NodeNameFilterPattern,
	type OutputNodeNameFilterPatterns} from "./implementation/utils/PatternUtils";
import {type InteractionEventResponseMapping} from "./interfaces/events/EventResponseMapping";
import {type IDragEvent} from "./interfaces/events/IDragEvent";
import {type IHoverEvent} from "./interfaces/events/IHoverEvent";
import {type IMultiSelectEvent} from "./interfaces/events/IMultiSelectEvent";
import {type ISelectEvent} from "./interfaces/events/ISelectEvent";
import {
	type IInteractionData,
	type IInteractionTypes} from "./interfaces/IInteractionData";
import {
	type IInteractionEngine,
	INTERACTION_STATE} from "./interfaces/IInteractionEngine";
import {
	type IInteractionFilterOptions,
	type IInteractionManager} from "./interfaces/IInteractionManager";
import {
	type IInteractionEffect,
	type IInteractionEffectUtils} from "./interfaces/utils/IInteractionEffectUtils";

export {AbstractInteractionManager,
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
	SelectOnUpManager};
export type {AngularRestrictionProperties,
	AxisRestrictionProperties,
	CameraPlaneRestrictionProperties,
	DraggingRestrictionMetaData,
	DrawingRestrictionMetaData,
	GeometryRestrictionProperties,
	GridRestrictionProperties,
	IAmbientLightApi,
	ICameraApi,
	IDirectionalLightApi,
	IDragEvent,
	IHemisphereLightApi,
	IHoverEvent,
	IInteractionData,
	IInteractionEffect,
	IInteractionEffectUtils,
	IInteractionEngine,
	IInteractionFilterOptions,
	IInteractionManager,
	IInteractionTypes,
	IIntersectionDefinition,
	IIntersectionFilter,
	ILightApi,
	ILightSceneApi,
	IMultiSelectEvent,
	InteractionEventResponseMapping,
	IOrthographicCameraApi,
	IPerspectiveCameraApi,
	IPointLightApi,
	IRay,
	IRestriction,
	IRestrictionApi,
	ISelectEvent,
	ISnapRestriction,
	ISnapRestrictionApi,
	ISpotLightApi,
	IViewportApi,
	LineRestrictionProperties,
	NodeNameFilterPattern,
	OutputNodeNameFilterPatterns,
	PlaneRestrictionProperties,
	PointRestrictionProperties,
	RestrictionDefinition,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	SnapRestrictionProperties};
