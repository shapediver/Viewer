import { ShapeDiverResponseParameterType, ShapeDiverResponseParameterVisualization } from '@shapediver/sdk.geometry-api-sdk-v2';
import { SESSION_SETTINGS_MODE } from '@shapediver/viewer.shared.services';
import { vec3, vec4 } from 'gl-matrix';
import { BUSY_MODE_DISPLAY, SPINNER_POSITIONING, VISIBILITY_MODE } from './interfaces/renderingEngine/enums';

export type Color = string | number | number[] | vec3 | vec4;

/**
 * The type of the parameter.
 */
export {
    ShapeDiverResponseParameterType as PARAMETER_TYPE,
    ShapeDiverResponseParameterVisualization as PARAMETER_VISUALIZATION
};

export interface ISettingsSections {
    // #region Properties (2)

    session?: ISessionSettingsSections,
    viewport?: IViewportSettingsSections

    // #endregion Properties (2)
}

export interface ISessionSettingsSections {
    // #region Properties (2)

    export?: {
        /** Option to update the displayname of the exports (default: false) */
        displayname?: boolean,
        /** Option to update the order of the exports (default: false) */
        order?: boolean,
        /** Option to update the hidden state of the exports (default: false) */
        hidden?: boolean
    }

    parameter?: {
        /** Option to update the displayname of the parameters (default: false) */
        displayname?: boolean,
        /** Option to update the order of the parameters (default: false) */
        order?: boolean,
        /** Option to update the hidden state of the parameters (default: false) */
        hidden?: boolean,
        /** Option to update the value of the parameters (default: false) */
        value?: boolean
    },

    // #endregion Properties (2)
}

export interface IViewportSettingsSections {
    // #region Properties (7)

    /** Option to update the ar settings (default: false) */
    ar?: boolean,
    /** Option to update the camera settings (default: false) */
    camera?: boolean,
    /** Option to update the environment settings (default: false) */
    environment?: boolean
    /** Option to update the general settings (default: false) */
    general?: boolean
    /** Option to update the light settings (default: false) */
    light?: boolean,
    /** Option to update the postprocessing settings (default: false) */
    postprocessing?: boolean
    /** Option to update the scene settings (default: false) */
    scene?: boolean,

    // #endregion Properties (7)
}

export type SessionCreationDefinition = {
    /** The ticket for direct embedding of the model represented by the session. This identifies the model on the Geometry Backend. If no ticket was provided, a {@link guid} has to be provided instead. */
    ticket?: string,
    /** The geometry backend model id (guid). This identifies the model on the Geometry Backend. A {@link jwtToken} is needed for authentication. If no guid was provided, a {@link ticket} has to be provided instead. */
    guid?: string,
    /** The modelViewUrl of the {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} hosting the model. */
    modelViewUrl: string,
    /** The JWT used for authorizing API calls to the Geometry Backend. */
    jwtToken?: string,
    /** The unique identifier of the session that was specified or automatically chosen on creation of the session. */
    id?: string,
    /** Option to wait for the outputs to be loaded, or return immediately after creation of the session. (default: true) */
    waitForOutputs?: boolean,
    /** Option to allow the outputs to be loaded, or to prevent them from being loaded. (default: true) */
    allowOutputLoading?: boolean,
    /** Option to load the outputs, or not load them until the first call of {@link ISession.customize}. (default: true) */
    loadOutputs?: boolean,
    /** Option to load the SDTF data. The data is not loaded by default as it can be quite large. (default: false) */
    loadSdtf?: boolean,
    /** Option to exclude some viewports from the start. Can be accessed via {@link ISession.excludeViewports}. */
    excludeViewports?: string[],
    /** The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified. */
    initialParameterValues?: { [key: string]: string },
    /** The optional model state id to use for the session. If not provided, no model state will be loaded. */
    modelStateId?: string,
    /** The optional model state validation mode to use for the session. If not provided, the default validation mode of the Geometry SDK will be used. */
    modelStateValidationMode?: string,
    /** Option to throw an error if parts of a customization failed. (default: false) */
    throwOnCustomizationError?: boolean
};

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
         * Where the spinner that is specified by {@link BUSY_MODE_DISPLAY} is displayed on the screen. (default: BUSY_MODE_DISPLAY.BOTTOM_RIGHT)
         */
        spinnerPositioning?: SPINNER_POSITIONING

    },
    /** The id of the session of which the settings should be used. Only works when {@link sessionSettingsMode} is set to {@link SESSION_SETTINGS_MODE.SESSION}. */
    sessionSettingsId?: string,
    /** The mode in which settings should be applied. (default: SESSION_SETTINGS_MODE.FIRST) */
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    /** The initial visibility of the viewport. (default: VISIBILITY_MODE.SESSION) */
    visibility?: VISIBILITY_MODE,
    /** 
     * The ids of the sessions that should be displayed in the viewport. This only is considered if the {@link visibility} is set to {@link VISIBILITY_MODE.SESSIONS}.
     * It's recommended that with this workflow, the {@link sessionSettingsMode} is set to {@link SESSION_SETTINGS_MODE.SESSION} and a {@link sessionSettingsId} is provided.
     */
    visibilitySessionIds?: string[],
}
