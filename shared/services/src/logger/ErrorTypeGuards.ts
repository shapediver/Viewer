/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ShapeDiverGeometryBackendError,
	ShapeDiverGeometryBackendRequestError,
	ShapeDiverGeometryBackendResponseError} from "./ShapeDiverBackendErrors";
import {
	ShapeDiverViewerError,
	ShapeDiverViewerErrorType} from "./ShapeDiverError";
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
	ShapeDiverViewerWebGLError} from "./ShapeDiverViewerErrors";

/** Type guard for all error types of the viewer package. */
export function isViewerError(e: any): e is ShapeDiverViewerError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		Object.values(ShapeDiverViewerErrorType).includes(
			(<ShapeDiverViewerError>e).errorType as any,
		)
	);
}

/** Type guard for an unknown viewer error. */
export function isViewerUnknownError(
	e: any,
): e is ShapeDiverViewerUnknownError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.UNKNOWN
	);
}

/** Type guard for a data processing viewer error. */
export function isViewerDataProcessingError(
	e: any,
): e is ShapeDiverViewerDataProcessingError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.DATA_PROCESSING_ERROR
	);
}

/** Type guard for a environment map viewer error. */
export function isViewerEnvironmentMapError(
	e: any,
): e is ShapeDiverViewerEnvironmentMapError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.ENVIRONMENT_MAP_ERROR
	);
}

/** Type guard for a webGL viewer error. */
export function isViewerWebGLError(e: any): e is ShapeDiverViewerWebGLError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.WEBGL_ERROR
	);
}

/** Type guard for a settings viewer error. */
export function isViewerSettingsError(
	e: any,
): e is ShapeDiverViewerSettingsError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.SETTINGS_ERROR
	);
}

/** Type guard for a session viewer error. */
export function isViewerSessionError(
	e: any,
): e is ShapeDiverViewerSessionError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.SESSION_ERROR
	);
}

/** Type guard for a customization viewer error. */
export function isViewerCustomizationError(
	e: any,
): e is ShapeDiverViewerCustomizationError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.CUSTOMIZATION_ERROR
	);
}

/** Type guard for a viewport viewer error. */
export function isViewerViewportError(
	e: any,
): e is ShapeDiverViewerViewportError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.VIEWPORT_ERROR
	);
}

/** Type guard for a light viewer error. */
export function isViewerLightError(e: any): e is ShapeDiverViewerLightError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.LIGHT_ERROR
	);
}

/** Type guard for a camera viewer error. */
export function isViewerCameraError(e: any): e is ShapeDiverViewerCameraError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.CAMERA_ERROR
	);
}

/** Type guard for an AR viewer error. */
export function isARError(e: any): e is ShapeDiverViewerArError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.AR_ERROR
	);
}

/** Type guard for a validation viewer error. */
export function isViewerValidationError(
	e: any,
): e is ShapeDiverViewerValidationError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.VALIDATION_ERROR
	);
}

/** Type guard for a interaction viewer error. */
export function isViewerInteractionError(
	e: any,
): e is ShapeDiverViewerInteractionError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.INTERACTION_ERROR
	);
}

/** Type guard for a drawing tools viewer error. */
export function isViewerDrawingToolsError(
	e: any,
): e is ShapeDiverViewerDrawingToolsError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.DRAWING_TOOLS_ERROR
	);
}

/** Type guard for all error types of the Geometry Backend SDK package that are mapped to viewer errors. */
export function isViewerGeometryBackendError(
	e: any,
): e is ShapeDiverGeometryBackendError &
	ShapeDiverGeometryBackendRequestError &
	ShapeDiverGeometryBackendResponseError {
	return (
		(e instanceof Error &&
			"errorType" in e &&
			(<ShapeDiverViewerError>e).errorType ===
				ShapeDiverViewerErrorType.GEOMETRY_BACKEND_ERROR) ||
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_REQUEST_ERROR ||
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_REQUEST_ERROR
	);
}

/** Type guard for a Geometry Backend SDK generic error that is mapped to a viewer error. */
export function isViewerGeometryBackendGenericError(
	e: any,
): e is ShapeDiverGeometryBackendError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_ERROR
	);
}

/** Type guard for a Geometry Backend SDK request error that is mapped to a viewer error. */
export function isViewerGeometryBackendRequestError(
	e: any,
): e is ShapeDiverGeometryBackendRequestError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_REQUEST_ERROR
	);
}

/** Type guard for a Geometry Backend SDK response error that is mapped to a viewer error. */
export function isViewerGeometryBackendResponseError(
	e: any,
): e is ShapeDiverGeometryBackendResponseError {
	return (
		e instanceof Error &&
		"errorType" in e &&
		(<ShapeDiverViewerError>e).errorType ===
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_RESPONSE_ERROR
	);
}
