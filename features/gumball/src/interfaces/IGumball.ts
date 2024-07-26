export interface IGumball {
    // #region Properties (5)

    enableRotation: boolean;
    enableScaling: boolean;
    enableTranslation: boolean;
    show: boolean;
    space: 'local' | 'world';

    // #endregion Properties (5)

    // #region Public Methods (1)

    close(): void;

    // #endregion Public Methods (1)
}