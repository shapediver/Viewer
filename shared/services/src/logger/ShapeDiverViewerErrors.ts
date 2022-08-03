import { ShapeDiverViewerError, ShapeDiverViewerErrorType } from "./ShapeDiverError";


export class ShapeDiverViewerUnknownError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.UNKNOWN, 'An unknown error occurred.', message);
        Error.captureStackTrace(this, ShapeDiverViewerUnknownError)
    }
}

export class ShapeDiverViewerDataProcessingError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.DATA_PROCESSING_ERROR, 'An error occurred while processing data.', message);
    }
}

export class ShapeDiverViewerEnvironmentMapError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly url?: string | string[],
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.ENVIRONMENT_MAP_ERROR, 'An error occurred while loading the environment map.', message);
    }
}

export class ShapeDiverViewerWebGLError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.WEBGL_ERROR, 'An error occurred regarding to the WebGL context.', message);
    }
}

export class ShapeDiverViewerSettingsError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.SETTINGS_ERROR, 'An error occurred while loading the settings.', message);
    }
}

export class ShapeDiverViewerSessionError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.SESSION_ERROR, 'An error occurred while working with the session.', message);
    }
}

export class ShapeDiverViewerLightError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.LIGHT_ERROR, 'An error occurred while working with the lights.', message);
    }
}

export class ShapeDiverViewerCameraError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.CAMERA_ERROR, 'An error occurred while working with the cameras.', message);
    }
}

export class ShapeDiverViewerGeneralError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.GENERAL_VIEWPORT_ERROR, 'An error occurred while working with the viewer.', message);
    }
}

export class ShapeDiverViewerArError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.AR_ERROR, 'An error occurred while working with AR.', message);
    }
}

export class ShapeDiverViewerValidationError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly value: any,
        public readonly requestedType: string,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.VALIDATION_ERROR, 'An error occurred while validating the value.', message);
    }
}

export class ShapeDiverViewerConnectionError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly status?: number,
        public readonly errorObject?: Error | unknown
    ) {
        super(ShapeDiverViewerErrorType.CONNECTION_ERROR, 'An error occurred while loading data.', message);
    }
}

export class ShapeDiverViewerInteractionError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string
    ) {
        super(ShapeDiverViewerErrorType.INTERACTION_ERROR, 'An error occurred with interactions.', message);
    }
}