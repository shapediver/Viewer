import { Converter } from './converter/Converter';
import { DomEventEngine } from './dom-event-engine/DomEventEngine';
import { EventEngine } from './event-engine/EventEngine';
import {
    EVENTTYPE,
    EVENTTYPE_CAMERA,
    EVENTTYPE_DRAWING_TOOLS,
    EVENTTYPE_INTERACTION,
    EVENTTYPE_OUTPUT,
    EVENTTYPE_RENDERING,
    EVENTTYPE_SCENE,
    EVENTTYPE_SESSION,
    EVENTTYPE_TASK,
    EVENTTYPE_VIEWPORT,
    MainEventTypes
} from './event-engine/EventTypes';
import { HttpClient } from './http-client/HttpClient';
import { HttpResponse } from './http-client/HttpResponse';
import { IDomEventListener } from './dom-event-engine/IDomEventListener';
import { IEvent } from './event-engine/interfaces/IEvent';
import { InputValidator } from './input-validator/InputValidator';
import {
    isARError,
    isViewerCameraError,
    isViewerDataProcessingError,
    isViewerDrawingToolsError,
    isViewerEnvironmentMapError,
    isViewerError,
    isViewerGeometryBackendError,
    isViewerGeometryBackendGenericError,
    isViewerGeometryBackendRequestError,
    isViewerGeometryBackendResponseError,
    isViewerInteractionError,
    isViewerLightError,
    isViewerSessionError,
    isViewerSettingsError,
    isViewerUnknownError,
    isViewerValidationError,
    isViewerViewportError,
    isViewerWebGLError
} from './logger/ErrorTypeGuards';
import { ISessionGlobalAccessObjectDefinition } from './state-engine/ISessionGlobalAccessObjectDefinition';
import { IViewportGlobalAccessObjectDefinition } from './state-engine/IViewportGlobalAccessObjectDefinition';
import { Logger, LOGGING_LEVEL } from './logger/Logger';
import { PerformanceEvaluator } from './performance-evaluator/PerformanceEvaluator';
import { SESSION_SETTINGS_MODE, SettingsEngine } from './settings-engine/SettingsEngine';
import { ShapeDiverGeometryBackendError, ShapeDiverGeometryBackendRequestError, ShapeDiverGeometryBackendResponseError } from './logger/ShapeDiverBackendErrors';
import { ShapeDiverResponseErrorType as ShapeDiverGeometryBackendResponseErrorType } from '@shapediver/sdk.geometry-api-sdk-v2';
import {
    ShapeDiverViewerArError,
    ShapeDiverViewerCameraError,
    ShapeDiverViewerDataProcessingError,
    ShapeDiverViewerDrawingToolsError,
    ShapeDiverViewerEnvironmentMapError,
    ShapeDiverViewerInteractionError,
    ShapeDiverViewerLightError,
    ShapeDiverViewerSessionError,
    ShapeDiverViewerSettingsError,
    ShapeDiverViewerUnknownError,
    ShapeDiverViewerValidationError,
    ShapeDiverViewerViewportError,
    ShapeDiverViewerWebGLError
} from './logger/ShapeDiverViewerErrors';
import { ShapeDiverViewerError, ShapeDiverViewerErrorType } from './logger/ShapeDiverError';
import { StateEngine } from './state-engine/StateEngine';
import { StatePromise } from './state-engine/StatePromise';
import { SystemInfo } from './system-info/SystemInfo';
import { TypeChecker } from './type-check/TypeChecker';
import { UuidGenerator } from './uuid-generator/UuidGenerator';
import { atobCustom, btoaCustom } from './utilities/base64';

export {
    EventEngine, EVENTTYPE, MainEventTypes, IEvent,
    EVENTTYPE_CAMERA, EVENTTYPE_OUTPUT, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWPORT, EVENTTYPE_INTERACTION, EVENTTYPE_DRAWING_TOOLS, EVENTTYPE_TASK
};

export {
    SettingsEngine, SESSION_SETTINGS_MODE
};

export {
    StateEngine, StatePromise,
    IViewportGlobalAccessObjectDefinition, ISessionGlobalAccessObjectDefinition
};

export {
    SystemInfo
};

export {
    IDomEventListener, DomEventEngine
};

export {
    HttpClient, HttpResponse
};

export {
    UuidGenerator
};

export {
    Converter
};

export {
    TypeChecker
};

export {
    InputValidator
};

export {
    Logger, LOGGING_LEVEL,
    ShapeDiverViewerErrorType,
    ShapeDiverViewerError,
    ShapeDiverViewerDataProcessingError,
    ShapeDiverViewerEnvironmentMapError,
    ShapeDiverViewerWebGLError,
    ShapeDiverViewerSettingsError,
    ShapeDiverViewerSessionError,
    ShapeDiverViewerViewportError,
    ShapeDiverViewerUnknownError,
    ShapeDiverViewerArError,
    ShapeDiverViewerLightError,
    ShapeDiverViewerCameraError,
    ShapeDiverViewerValidationError,
    ShapeDiverViewerInteractionError,
    ShapeDiverViewerDrawingToolsError,
    ShapeDiverGeometryBackendError,
    ShapeDiverGeometryBackendRequestError,
    ShapeDiverGeometryBackendResponseError,
    ShapeDiverGeometryBackendResponseErrorType
};

export {
    isViewerError,
    isViewerUnknownError,
    isViewerDataProcessingError,
    isViewerEnvironmentMapError,
    isViewerWebGLError,
    isViewerSettingsError,
    isViewerSessionError,
    isViewerViewportError,
    isViewerLightError,
    isViewerCameraError,
    isARError,
    isViewerValidationError,
    isViewerInteractionError,
    isViewerDrawingToolsError,
    isViewerGeometryBackendError,
    isViewerGeometryBackendGenericError,
    isViewerGeometryBackendRequestError,
    isViewerGeometryBackendResponseError
};

export {
    PerformanceEvaluator
};

export {
    atobCustom, btoaCustom
};