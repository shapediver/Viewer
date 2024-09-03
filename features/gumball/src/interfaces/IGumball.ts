import { IDomEventListener } from '@shapediver/viewer';

// #region Type aliases (2)

export type Settings = {
    /**
     * Enable or disable rotation. (default: true)
     */
    enableRotation: boolean;
    /**
     * Enable or disable scaling. (default: true)
     */
    enableScaling: boolean;
    /**
     * Enable or disable translation. (default: true)
     */
    enableTranslation: boolean;
    /**
     * The scale of the Gumball compared to the screen size. (default: 0.15)
     */
    scale: number;
    /**
     * The space in which the Gumball operates. (default: 'local')
     */
    space: 'local' | 'world';
    /**
     * Reuse the transformation that are already applied to the nodes. (default: true)
     */
    reuseTransformation: boolean;
};
export type SettingsOptional = Partial<Settings>;

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IGumball extends IDomEventListener {
    // #region Properties (6)

    /**
     * Reuse the transformation that are already applied to the nodes.
     */
    readonly reuseTransformation: boolean;
    /**
     * The scale of the Gumball compared to the screen size.
     */
    readonly space: 'local' | 'world';

    /**
     * Enable or disable rotation.
     */
    enableRotation: boolean;
    /**
     * Enable or disable scaling
     */
    enableScaling: boolean;
    /**
     * Enable or disable translation
     */
    enableTranslation: boolean;
    /**
     * Show or hide the Gumball.
     */
    show: boolean;

    // #endregion Properties (6)

    // #region Public Methods (1)

    close(): void;

    // #endregion Public Methods (1)
}

// #endregion Interfaces (1)
