export abstract class ShapeDiverViewerError {
    // #region Constructors (1)

    constructor(
        public readonly error: string,
        public readonly desc: string,
        public readonly message: string,
    ) {}

    // #endregion Constructors (1)
}

export class ShapeDiverViewerUnknownError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject: Error
    ) {
        super('UnknownError', 'An unknown error occurred.', message);
    }
}

export class ShapeDiverViewerDataProcessingError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('DataProcessingError', 'An error occurred while processing data.', message);
    }
}

export class ShapeDiverViewerEnvironmentMapError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly url?: string | string[],
        public readonly errorObject?: Error
    ) {
        super('EnvironmentMapError', 'An error occurred while loading the environment map.', message);
    }
}

export class ShapeDiverViewerWebGLError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('WebGLError', 'An error occurred regarding to the WebGL context.', message);
    }
}

export class ShapeDiverViewerSettingsError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('SettingsError', 'An error occurred while loading the settings.', message);
    }
}

export class ShapeDiverViewerSessionError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('SessionError', 'An error occurred while working with the session.', message);
    }
}

export class ShapeDiverViewerLightError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('LightError', 'An error occurred while working with the lights.', message);
    }
}

export class ShapeDiverViewerCameraError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('CameraError', 'An error occurred while working with the cameras.', message);
    }
}

export class ShapeDiverViewerViewerError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('ViewerError', 'An error occurred while working with the viewer.', message);
    }
}

export class ShapeDiverViewerArError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly errorObject?: Error
    ) {
        super('ArError', 'An error occurred while working with AR.', message);
    }
}

export class ShapeDiverViewerValidationError extends ShapeDiverViewerError {
    constructor(
        public readonly message: string,
        public readonly value: any,
        public readonly requestedType: string,
        public readonly errorObject?: Error
    ) {
        super('ValidationError', 'An error occurred while validating the value.', message);
    }
}