import {ResErrorType as ShapeDiverGeometryBackendResponseErrorType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	EVENTTYPE,
	EVENTTYPE_CAMERA,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	EVENTTYPE_VIEWPORT,
	IEvent,
	MainEventTypes,
	SESSION_SETTINGS_MODE,
} from "@shapediver/viewer.shared.types";
import {Converter} from "./converter/Converter";
import {DomEventEngine} from "./dom-event-engine/DomEventEngine";
import {IDomEventListener} from "./dom-event-engine/IDomEventListener";
import {EventEngine} from "./event-engine/EventEngine";
import {HashCreator} from "./hash-creator/HashCreator";
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
	SettingsEngine,
} from "./settings-engine/SettingsEngine";
import {ISessionGlobalAccessObjectDefinition} from "./state-engine/ISessionGlobalAccessObjectDefinition";
import {IViewportGlobalAccessObjectDefinition} from "./state-engine/IViewportGlobalAccessObjectDefinition";
import {StateEngine} from "./state-engine/StateEngine";
import {StatePromise} from "./state-engine/StatePromise";
import {SystemInfo} from "./system-info/SystemInfo";
import {TypeChecker} from "./type-check/TypeChecker";
import {atobCustom, btoaCustom} from "./utilities/base64";
import {hashForArraySampled} from "./utilities/hashCreator";
import {numberCleaner} from "./utilities/numberCleaner";
import {ObservableArray} from "./utilities/ObservableArray";
import {UuidGenerator} from "./uuid-generator/UuidGenerator";

export {
	atobCustom,
	btoaCustom,
	Converter,
	defaultSettings,
	DomEventEngine,
	EventEngine,
	EVENTTYPE,
	EVENTTYPE_CAMERA,
	EVENTTYPE_DRAWING_TOOLS,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	EVENTTYPE_VIEWPORT,
	HashCreator,
	hashForArraySampled,
	HttpClient,
	InputValidator,
	isARError,
	isValid,
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
	Logger,
	LOGGING_LEVEL,
	numberCleaner,
	ObservableArray,
	PerformanceEvaluator,
	SESSION_SETTINGS_MODE,
	SettingsEngine,
	ShapeDiverGeometryBackendError,
	ShapeDiverGeometryBackendRequestError,
	ShapeDiverGeometryBackendResponseError,
	ShapeDiverGeometryBackendResponseErrorType,
	ShapeDiverViewerArError,
	ShapeDiverViewerCameraError,
	ShapeDiverViewerCustomizationError,
	ShapeDiverViewerDataProcessingError,
	ShapeDiverViewerDrawingToolsError,
	ShapeDiverViewerEnvironmentMapError,
	ShapeDiverViewerError,
	ShapeDiverViewerErrorType,
	ShapeDiverViewerInteractionError,
	ShapeDiverViewerLightError,
	ShapeDiverViewerSessionError,
	ShapeDiverViewerSettingsError,
	ShapeDiverViewerUnknownError,
	ShapeDiverViewerValidationError,
	ShapeDiverViewerViewportError,
	ShapeDiverViewerWebGLError,
	StateEngine,
	StatePromise,
	stringify,
	SystemInfo,
	TypeChecker,
	UuidGenerator,
};
export type {
	HttpResponse,
	IDomEventListener,
	IEvent,
	ISessionGlobalAccessObjectDefinition,
	IViewportGlobalAccessObjectDefinition,
	MainEventTypes,
};
