
export enum ShapeDiverViewerErrorType {
    AR_ERROR = 'SdARError',
    CAMERA_ERROR = 'SdCameraError',
    CONNECTION_ERROR = 'SdConnectionError',
    DATA_PROCESSING_ERROR = 'SdDataProcessingError',
    ENVIRONMENT_MAP_ERROR = 'SdEnvironmentMapError',
    GENERAL_VIEWPORT_ERROR = 'SdGeneralViewerError',
    INTERACTION_ERROR = 'SdInteractionError',
    LIGHT_ERROR = 'SdLightError',
    SESSION_ERROR = 'SdSessionError',
    SETTINGS_ERROR = 'SdSettingsError',
    VALIDATION_ERROR = 'SdValidationError',
    WEBGL_ERROR = 'SdWebGLError',
    UNKNOWN = "",
}
export interface IShapeDiverViewerError {
    error: ShapeDiverViewerErrorType;
    desc: string;
    message: string;
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

    constructor(
        public readonly error: ShapeDiverViewerErrorType,
        public readonly desc: string,
        message: string
    ) {
        super(message)

        this.error = (Object.values(ShapeDiverViewerErrorType).includes(error as any))
            ? error as ShapeDiverViewerErrorType
            : ShapeDiverViewerErrorType.UNKNOWN
    }

    // #endregion Constructors (1)
}