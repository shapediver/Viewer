export class OutputDelayException extends Error {
    // #region Constructors (1)

    /**
     * Exception that is thrown when there is an output with a delay property.
     * 
     * @param _delay the milliseconds to wait 
     */
    constructor(private readonly _delay: number) {
        super();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (1)

    public get delay(): number {
        return this._delay;
    }

    // #endregion Public Getters And Setters (1)
} 