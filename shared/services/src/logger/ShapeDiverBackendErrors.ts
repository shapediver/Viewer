import {ResErrorType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	ShapeDiverViewerError,
	ShapeDiverViewerErrorType,
} from "./ShapeDiverError";

export class ShapeDiverGeometryBackendRequestError extends ShapeDiverViewerError {
	// #region Constructors (1)

	constructor(message: string) {
		super(
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_REQUEST_ERROR,
			"A request to the geometry backend failed.",
			message,
		);
	}

	// #endregion Constructors (1)
}

export class ShapeDiverGeometryBackendResponseError extends ShapeDiverViewerError {
	// #region Constructors (1)

	constructor(
		message: string,
		public readonly status: number,
		public readonly geometryBackendErrorType: ResErrorType,
		public readonly desc: string,
	) {
		super(
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_RESPONSE_ERROR,
			desc,
			message,
		);
	}

	// #endregion Constructors (1)
}

export class ShapeDiverGeometryBackendError extends ShapeDiverViewerError {
	// #region Constructors (1)

	constructor(message: string) {
		super(
			ShapeDiverViewerErrorType.GEOMETRY_BACKEND_ERROR,
			"A generic geometry backend error occurred.",
			message,
		);
	}

	// #endregion Constructors (1)
}
