import { IDomEventListener } from '@shapediver/viewer';

// #region Type aliases (2)

export type Settings = {
    enableRotation: boolean;
    enableScaling: boolean;
    enableTranslation: boolean;
    scale: number;
    space: 'local' | 'world';
    reuseTransformation: boolean;
};
export type SettingsOptional = Partial<Settings>;

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IGumball extends IDomEventListener {
    // #region Properties (6)

    readonly reuseTransformation: boolean;
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
