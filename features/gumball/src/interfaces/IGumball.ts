// #region Type aliases (2)

export type Settings = {
    enableRotation: boolean;
    enableScaling: boolean;
    enableTranslation: boolean;
    scale: number;
    space: 'local' | 'world';
    resetTransformation: boolean;
};
export type SettingsOptional = Partial<Settings>;

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IGumball {
    // #region Properties (6)

    readonly resetTransformation: boolean;
    readonly space: 'local' | 'world';

    enableRotation: boolean;
    enableScaling: boolean;
    enableTranslation: boolean;
    show: boolean;

    // #endregion Properties (6)

    // #region Public Methods (1)

    close(): void;

    // #endregion Public Methods (1)
}

// #endregion Interfaces (1)
