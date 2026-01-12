import {ResErrorType as ShapeDiverGeometryBackendResponseErrorType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {Converter} from "./converter/Converter";
import {DomEventEngine} from "./dom-event-engine/DomEventEngine";
import {IDomEventListener} from "./dom-event-engine/IDomEventListener";
import {EventEngine} from "./event-engine/EventEngine";
import {
	EVENTTYPE,
	EVENTTYPE_CAMERA,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_GUMBALL,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	EVENTTYPE_VIEWPORT,
	MainEventTypes,
} from "./event-engine/EventTypes";
import {IEvent} from "./event-engine/interfaces/IEvent";
import {HttpClient} from "./http-client/HttpClient";
import {HttpResponse} from "./http-client/HttpResponse";
import {InputValidator} from "./input-validator/InputValidator";
import {
	isARError,
	isViewerCameraError,
	isViewerCustomizationError,
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
	isViewerWebGLError,
} from "./logger/ErrorTypeGuards";
import {Logger, LOGGING_LEVEL} from "./logger/Logger";
import {
	ShapeDiverGeometryBackendError,
	ShapeDiverGeometryBackendRequestError,
	ShapeDiverGeometryBackendResponseError,
} from "./logger/ShapeDiverBackendErrors";
import {
	ShapeDiverViewerError,
	ShapeDiverViewerErrorType,
} from "./logger/ShapeDiverError";
import {
	ShapeDiverViewerArError,
	ShapeDiverViewerCameraError,
	ShapeDiverViewerCustomizationError,
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
	ShapeDiverViewerWebGLError,
} from "./logger/ShapeDiverViewerErrors";
import {isValid, stringify} from "./parameter-utils/ParameterUtils";
import {PerformanceEvaluator} from "./performance-evaluator/PerformanceEvaluator";
import {
	defaultSettings,
	SESSION_SETTINGS_MODE,
	SettingsEngine,
} from "./settings-engine/SettingsEngine";
import {ISessionGlobalAccessObjectDefinition} from "./state-engine/ISessionGlobalAccessObjectDefinition";
import {IViewportGlobalAccessObjectDefinition} from "./state-engine/IViewportGlobalAccessObjectDefinition";
import {StateEngine} from "./state-engine/StateEngine";
import {StatePromise} from "./state-engine/StatePromise";
import {SystemInfo} from "./system-info/SystemInfo";
import {TypeChecker} from "./type-check/TypeChecker";
import {atobCustom, btoaCustom} from "./utilities/base64";
import {numberCleaner} from "./utilities/numberCleaner";
import {ObservableArray} from "./utilities/ObservableArray";
import {UuidGenerator} from "./uuid-generator/UuidGenerator";

export {
	EventEngine,
	EVENTTYPE,
	MainEventTypes,
	IEvent,
	EVENTTYPE_CAMERA,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_VIEWPORT,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_GUMBALL,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_TASK,
};
export {SettingsEngine, SESSION_SETTINGS_MODE, defaultSettings};
export {
	StateEngine,
	StatePromise,
	IViewportGlobalAccessObjectDefinition,
	ISessionGlobalAccessObjectDefinition,
};
export {SystemInfo};
export {IDomEventListener, DomEventEngine};
export {HttpClient, HttpResponse};
export {UuidGenerator};
export {Converter};
export {TypeChecker};
export {InputValidator};
export {
	Logger,
	LOGGING_LEVEL,
	ShapeDiverViewerErrorType,
	ShapeDiverViewerError,
	ShapeDiverViewerDataProcessingError,
	ShapeDiverViewerEnvironmentMapError,
	ShapeDiverViewerWebGLError,
	ShapeDiverViewerSettingsError,
	ShapeDiverViewerSessionError,
	ShapeDiverViewerCustomizationError,
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
	ShapeDiverGeometryBackendResponseErrorType,
};
export {
	isViewerError,
	isViewerUnknownError,
	isViewerDataProcessingError,
	isViewerEnvironmentMapError,
	isViewerWebGLError,
	isViewerSettingsError,
	isViewerSessionError,
	isViewerCustomizationError,
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
	isViewerGeometryBackendResponseError,
};
export {PerformanceEvaluator};
export {atobCustom, btoaCustom, numberCleaner, ObservableArray};
export {isValid, stringify};
