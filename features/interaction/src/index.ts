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
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionPropertiesBase,
	RESTRICTION_TYPE,
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
import {IInteractionEffectUtils} from "./interfaces/utils/IInteractionEffectUtils";

export {
	IInteractionEngine,
	InteractionEngine,
	IInteractionManager,
	AbstractInteractionManager,
};
export {InteractionData, IInteractionData, IInteractionTypes};
export {
	SelectManager,
	MultiSelectManager,
	SelectOnUpManager,
	HoverManager,
	DragManager,
};
export {IInteractionEffectUtils};
export {IInteractionFilterOptions, INTERACTION_STATE};
export {
	CameraPlaneConstraint,
	LineConstraint,
	PlaneConstraint,
	PointConstraint,
};
export {
	ISelectEvent,
	IMultiSelectEvent,
	IDragEvent,
	IHoverEvent,
	InteractionEventResponseMapping,
};
export {
	IRay,
	IViewportApi,
	ICameraApi,
	ILightSceneApi,
	IOrthographicCameraApi,
	IPerspectiveCameraApi,
	IAmbientLightApi,
	IDirectionalLightApi,
	IHemisphereLightApi,
	IPointLightApi,
	ISpotLightApi,
	ILightApi,
	IIntersectionFilter,
	IIntersectionDefinition,
};
export {
	NodeNameFilterPattern,
	OutputNodeNameFilterPatterns,
	gatherNodesForPattern,
	convertUserDefinedNameFilters,
	convertUserDefinedNameFiltersForInstances,
	getNodeData,
	getInstanceNodeData,
	matchNodesWithPatterns,
	addInteractionData,
	getNodesByName,
	calculateCombinedDraggedNodes,
	checkNodeNameMatch,
	getNodeName,
	isOnBlacklist,
};
export {IRestriction, ISnapRestriction};
export {
	RESTRICTION_TYPE,
	RestrictionDefinition,
	RestrictionProperties,
	RestrictionMetaData,
	DrawingRestrictionMetaData,
	DraggingRestrictionMetaData,
	SnapRestrictionProperties,
	PlaneRestrictionProperties,
	AngularRestrictionProperties,
	AxisRestrictionProperties,
	GridRestrictionProperties,
	GeometryRestrictionProperties,
	PointRestrictionProperties,
	LineRestrictionProperties,
	CameraPlaneRestrictionProperties,
	RestrictionPropertiesBase,
};
export {
	IRestrictionApi,
	ISnapRestrictionApi,
	PlaneRestrictionApi,
	AngularRestrictionApi,
	AxisRestrictionApi,
	GridRestrictionApi,
	GeometryRestrictionApi,
	CameraPlaneRestrictionApi,
	PointRestrictionApi,
	LineRestrictionApi,
};
