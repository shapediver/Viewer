export enum ShapeDiverViewerErrorType {
    AR_ERROR = 'SdARError',
    GEOMETRY_BACKEND_ERROR = 'SdGeometryBackendError',
    GEOMETRY_BACKEND_REQUEST_ERROR = 'SdGeometryBackendRequestError',
    GEOMETRY_BACKEND_RESPONSE_ERROR = 'SdGeometryBackendResponseError',
    CAMERA_ERROR = 'SdCameraError',
    CONNECTION_ERROR = 'SdConnectionError',
    CUSTOMIZATION_ERROR = 'SdCustomizationError',
    DATA_PROCESSING_ERROR = 'SdDataProcessingError',
    DRAWING_TOOLS_ERROR = 'SdDrawingToolsError',
    ENVIRONMENT_MAP_ERROR = 'SdEnvironmentMapError',
    INTERACTION_ERROR = 'SdInteractionError',
    LIGHT_ERROR = 'SdLightError',
    SESSION_ERROR = 'SdSessionError',
    SETTINGS_ERROR = 'SdSettingsError',
    VALIDATION_ERROR = 'SdValidationError',
    VIEWPORT_ERROR = 'SdViewerError',
    WEBGL_ERROR = 'SdWebGLError',
    UNKNOWN = '',
}

export interface IShapeDiverViewerError {
    // #region Properties (3)

    desc: string;
    errorType: ShapeDiverViewerErrorType;
    message: string;

    // #endregion Properties (3)
}

export class ShapeDiverError extends Error {
    // #region Constructors (1)

    constructor(message: string) {
        super(message)
    }

    // #endregion Constructors (1)
}

export class ShapeDiverViewerError extends ShapeDiverError implements IShapeDiverViewerError {
    // #region Constructors (1)
    public readonly errorType: ShapeDiverViewerErrorType = ShapeDiverViewerErrorType.UNKNOWN;

    constructor(
        errorType: ShapeDiverViewerErrorType,
        public readonly desc: string,
        message: string
    ) {
        super(message)

        this.errorType = (Object.values(ShapeDiverViewerErrorType).includes(errorType as any))
            ? errorType as ShapeDiverViewerErrorType
            : ShapeDiverViewerErrorType.UNKNOWN
    }

    // #endregion Constructors (1)
}