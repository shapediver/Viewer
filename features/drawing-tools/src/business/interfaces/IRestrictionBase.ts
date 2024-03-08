// #region Type aliases (1)

export type RestrictionBaseProperties = {
    /**
     * If the restriction is enabled
     */
    enabled: boolean;
    /**
     * If the restriction visualization is shown
     */
    showVisualization: boolean;
}

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface IRestrictionBase {
    // #region Properties (3)

    /**
     * The unique identifier of the restriction.
     */
    readonly id: string;

    /**
     * Whether the restriction is enabled or not.
     */
    enabled: boolean;
    /**
     * Whether the visualization of the restriction is shown or not (if there is one).
     */
    showVisualization: boolean;

    // #endregion Properties (3)

    // #region Public Methods (1)

    /**
     * Remove the visualization of the restriction.
     */
    removeVisualization(): void;

    // #endregion Public Methods (1)
}

// #endregion Interfaces (1)
