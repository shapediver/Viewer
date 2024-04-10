import { BUSY_MODE_DISPLAY, SPINNER_POSITIONING, VISIBILITY_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import { ISettings } from '@shapediver/viewer.settings';
import { SESSION_SETTINGS_MODE } from '@shapediver/viewer.shared.services';

// #region Type aliases (1)

export type ViewportCreationDefinition = {
    /** The canvas element in which the viewport should be created, it is encourage to provide one. If none was provided, a canvas will be created. */
    canvas?: HTMLCanvasElement,
    /** The unique identifier of the session that was specified or automatically chosen on creation of the viewport. */
    id?: string,
    /** The branding options of the viewport. */
    branding?: {
        /** 
         * Optional URL to a logo to be displayed while the viewport is hidden. 
         * A default logo will be used if none is provided. 
         * Supply null to display no logo at all.
         */
        logo?: string | null,
        /** 
         * Optional background color to show while the viewport is hidden, can include alpha channel. 
         * A default color will be used if none is provided.
         */
        backgroundColor?: string,
        /** 
         * Optional URL to a logo to be displayed while the viewport is in busy mode. 
         * A default logo will be used if none is provided. 
         * The positioning of the spinner can be influenced via {@link SPINNER_POSITIONING}.
         */
        busyModeSpinner?: string,
        /**
         * The mode used to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER)
         * Whenever the busy mode gets toggled, the events {@link EVENTTYPE_VIEWPORT.BUSY_MODE_ON} and {@link EVENTTYPE_VIEWPORT.BUSY_MODE_OFF} will be emitted.
         */
        busyModeDisplay?: BUSY_MODE_DISPLAY,
        /**
         * Where the spinner that is specified by {@link BUSY_MODE_DISPLAY} is desplayed on the screen. (default: BUSY_MODE_DISPLAY.BOTTOM_RIGHT)
         */
        spinnerPositioning?: SPINNER_POSITIONING

    },
    /** The id of the session of which the settings should be used. Only works when {@link sessionSettingsMode} is set to {@link SESSION_SETTINGS_MODE.SESSION}. */
    sessionSettingsId?: string,
    /** The mode in which settings should be applied. (default: SESSION_SETTINGS_MODE.FIRST) */
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    /** The initial visibility of the viewport. (default: VISIBILITY_MODE.SESSION) */
    visibility?: VISIBILITY_MODE,
}

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface ICreationControlCenterViewport {
    // #region Properties (2)

    updateViewports?: (viewportEngines: { [key: string]: RenderingEngineThreeJs; }) => void;
    viewportEngines: { [key: string]: RenderingEngineThreeJs; };

    // #endregion Properties (2)

    // #region Public Methods (4)

    applyViewportSettings(viewportId: string, settings: ISettings, sections?: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; postprocessing?: boolean | undefined }): Promise<void>;
    closeViewportEngine(id: string): Promise<void>;
    createViewportEngine(properties: ViewportCreationDefinition): Promise<RenderingEngineThreeJs>;
    getViewportSettings(viewportId: string): ISettings;

    // #endregion Public Methods (4)
}

// #endregion Interfaces (1)
