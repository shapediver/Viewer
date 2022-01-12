import { ShapeDiverViewerError, ShapeDiverViewerErrorType } from "./ShapeDiverError";


export class ShapeDiverViewerUnknownError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject: Error
    ) {
        super(ShapeDiverViewerErrorType.UNKNOWN, 'An unknown error occurred.', message);
        Error.captureStackTrace(this, ShapeDiverViewerUnknownError)
    }
}

export class ShapeDiverViewerDataProcessingError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.DATA_PROCESSING_ERROR, 'An error occurred while processing data.', message);
    }
}

export class ShapeDiverViewerEnvironmentMapError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly url?: string | string[],
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.ENVIRONMENT_MAP_ERROR, 'An error occurred while loading the environment map.', message);
    }
}

export class ShapeDiverViewerWebGLError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.WEBGL_ERROR, 'An error occurred regarding to the WebGL context.', message);
    }
}

export class ShapeDiverViewerSettingsError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.SETTINGS_ERROR, 'An error occurred while loading the settings.', message);
    }
}

export class ShapeDiverViewerSessionError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.SESSION_ERROR, 'An error occurred while working with the session.', message);
    }
}

export class ShapeDiverViewerLightError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.LIGHT_ERROR, 'An error occurred while working with the lights.', message);
    }
}

export class ShapeDiverViewerCameraError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.CAMERA_ERROR, 'An error occurred while working with the cameras.', message);
    }
}

export class ShapeDiverViewerGeneralError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.GENERAL_VIEWER_ERROR, 'An error occurred while working with the viewer.', message);
    }
}

export class ShapeDiverViewerArError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.AR_ERROR, 'An error occurred while working with AR.', message);
    }
}

export class ShapeDiverViewerValidationError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly value: any,
        public readonly requestedType: string,
        public readonly errorObject?: Error
    ) {
        super(ShapeDiverViewerErrorType.VALIDATION_ERROR, 'An error occurred while validating the value.', message);
    }
}