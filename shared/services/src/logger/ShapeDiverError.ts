export class ShapeDiverError extends Error {
    // #region Constructors (1)

    constructor(
        public readonly error: string,
        public readonly desc: string,
        message: string,
    ) {
        super(message)
    }

    // #endregion Constructors (1)
}

export class ShapeDiverViewerError extends ShapeDiverError {
    // #region Constructors (1)

    constructor(
        public readonly error: string,
        public readonly desc: string,
        message: string,
    ) {
        super(error, desc, message)
    }

    // #endregion Constructors (1)
}