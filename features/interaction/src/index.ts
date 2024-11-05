import { AbstractInteractionManager } from './implementation/AbstractInteractionManager';
import {
    addInteractionData,
    calculateCombinedDraggedNodes,
    convertUserDefinedNameFilters,
    gatherNodesForPattern,
    getNodeData,
    getNodesByName,
    matchNodesWithPatterns,
    NodeNameFilterPattern,
    OutputNodeNameFilterPatterns
} from './implementation/utils/PatternUtils';
import { CameraPlaneConstraint } from './implementation/dragConstraints/CameraPlaneConstraint';
import {
    CameraPlaneRestrictionProperties,
    GeometryRestrictionProperties,
    LineRestrictionProperties,
    PlaneRestrictionProperties,
    PointRestrictionProperties,
    RestrictionProperties
} from '@shapediver/viewer.rendering-engine.intersection-restriction-engine';
import { DragManager } from './implementation/managers/DragManager';
import { HoverManager } from './implementation/managers/HoverManager';
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
    IViewportApi
} from '@shapediver/viewer';
import { IDragEvent } from './interfaces/events/IDragEvent';
import { IHoverEvent } from './interfaces/events/IHoverEvent';
import { IInteractionData, IInteractionTypes } from './interfaces/IInteractionData';
import { IInteractionEffectUtils } from './interfaces/utils/IInteractionEffectUtils';
import { IInteractionEngine, INTERACTION_STATE } from './interfaces/IInteractionEngine';
import { IInteractionFilterOptions, IInteractionManager } from './interfaces/IInteractionManager';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IMultiSelectEvent } from './interfaces/events/IMultiSelectEvent';
import { InteractionData } from './implementation/InteractionData';
import { InteractionEngine } from './implementation/InteractionEngine';
import { InteractionEventResponseMapping } from './interfaces/events/EventResponseMapping';
import { ISelectEvent } from './interfaces/events/ISelectEvent';
import { LineConstraint } from './implementation/dragConstraints/LineConstraint';
import { MultiSelectManager } from './implementation/managers/MultiSelectManager';
import { PlaneConstraint } from './implementation/dragConstraints/PlaneConstraint';
import { PointConstraint } from './implementation/dragConstraints/PointConstraint';
import { SelectManager } from './implementation/managers/SelectManager';
import { SelectOnUpManager } from './implementation/managers/SelectOnUpManager';
import { RestrictionDefinition } from '@shapediver/viewer.shared.types';

export {
    IInteractionEngine, InteractionEngine, IInteractionManager, AbstractInteractionManager
};

export {
    InteractionData, IInteractionData, IInteractionTypes
};

export {
    SelectManager, MultiSelectManager, SelectOnUpManager, HoverManager, DragManager
};

export {
    IInteractionEffectUtils
};

export {
    IInteractionFilterOptions, INTERACTION_STATE
};

export {
    CameraPlaneConstraint, LineConstraint, PlaneConstraint, PointConstraint
};

export {
    ISelectEvent, IMultiSelectEvent, IDragEvent, IHoverEvent, InteractionEventResponseMapping
};

export {
    IRay, IViewportApi, ICameraApi, ILightSceneApi, IOrthographicCameraApi, IPerspectiveCameraApi, IAmbientLightApi, IDirectionalLightApi, IHemisphereLightApi, IPointLightApi, ISpotLightApi, ILightApi, IIntersectionFilter, IIntersection
};

export {
    NodeNameFilterPattern, OutputNodeNameFilterPatterns, gatherNodesForPattern, convertUserDefinedNameFilters, getNodeData, matchNodesWithPatterns, addInteractionData, getNodesByName, calculateCombinedDraggedNodes
};

export {
    RestrictionDefinition, RestrictionProperties, PointRestrictionProperties, CameraPlaneRestrictionProperties, GeometryRestrictionProperties, LineRestrictionProperties, PlaneRestrictionProperties
};