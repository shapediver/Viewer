import { EventEngine } from './event-engine/EventEngine'
import { EVENTTYPE, EVENTTYPE_CAMERA, EVENTTYPE_DRAWING_TOOLS, EVENTTYPE_INTERACTION, EVENTTYPE_OUTPUT, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_TASK, EVENTTYPE_VIEWPORT, MainEventTypes } from './event-engine/EventTypes'
import { SettingsEngine } from './settings-engine/SettingsEngine'
import { StateEngine } from './state-engine/StateEngine'
import { SystemInfo } from './system-info/SystemInfo'
import { DomEventEngine } from './dom-event-engine/DomEventEngine'
import { IDomEventListener } from './dom-event-engine/IDomEventListener'
import { IEvent } from './event-engine/interfaces/IEvent'
import { Converter } from './converter/Converter'
import { HttpClient } from './http-client/HttpClient'
import { InputValidator } from './input-validator/InputValidator'
import { TypeChecker } from './type-check/TypeChecker'
import { UuidGenerator } from './uuid-generator/UuidGenerator'
import { PerformanceEvaluator } from './performance-evaluator/PerformanceEvaluator'
import { Logger, LOGGING_LEVEL } from './logger/Logger'
import { StatePromise } from './state-engine/StatePromise'
import { ShapeDiverViewerArError, ShapeDiverViewerCameraError, ShapeDiverViewerDataProcessingError, ShapeDiverViewerEnvironmentMapError, ShapeDiverViewerLightError, ShapeDiverViewerSessionError, ShapeDiverViewerSettingsError, ShapeDiverViewerUnknownError, ShapeDiverViewerValidationError, ShapeDiverViewerWebGLError, ShapeDiverViewerInteractionError, ShapeDiverViewerViewportError, ShapeDiverViewerDrawingToolsError } from './logger/ShapeDiverViewerErrors'
import { ShapeDiverViewerError, ShapeDiverViewerErrorType } from './logger/ShapeDiverError'
import { HttpResponse } from './http-client/HttpResponse'
import { ShapeDiverGeometryBackendError, ShapeDiverGeometryBackendRequestError, ShapeDiverGeometryBackendResponseError } from './logger/ShapeDiverBackendErrors'
import { ShapeDiverResponseErrorType as ShapeDiverGeometryBackendResponseErrorType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { isViewerError, isViewerUnknownError, isViewerDataProcessingError, isViewerEnvironmentMapError, isViewerWebGLError, isViewerSettingsError, isViewerSessionError, isViewerViewportError, isViewerLightError, isViewerCameraError, isARError, isViewerValidationError, isViewerInteractionError, isViewerGeometryBackendError, isViewerGeometryBackendGenericError, isViewerGeometryBackendRequestError, isViewerGeometryBackendResponseError, isViewerDrawingToolsError } from './logger/ErrorTypeGuards'

export {
  EventEngine, EVENTTYPE, MainEventTypes, IEvent,
  EVENTTYPE_CAMERA, EVENTTYPE_OUTPUT, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWPORT, EVENTTYPE_INTERACTION, EVENTTYPE_DRAWING_TOOLS, EVENTTYPE_TASK
}

export {
    SettingsEngine
}

export {
    StateEngine, StatePromise
}

export {
    SystemInfo
}

export {
    IDomEventListener, DomEventEngine
}

export {
    HttpClient, HttpResponse
}

export {
    UuidGenerator
}

export {
    Converter
}

export {
    TypeChecker
}

export {
    InputValidator
}

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
}

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
}

export {
    PerformanceEvaluator
}