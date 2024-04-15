import { ISettingsSections, SessionEngine } from '@shapediver/viewer.session-engine.session-engine';
import { ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2';

// #region Type aliases (1)

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
    /** Option to load the outputs, or not load them until the first call of {@link ISessioncustomize}. (default: true) */
    loadOutputs?: boolean,
    /** Option to exclude some viewports from the start. Can be accessed via {@link ISessionexcludeViewports}. */
    excludeViewports?: string[],
    /** The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified. */
    initialParameterValues?: { [key: string]: string }
};

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface ICreationControlCenterSession {
    // #region Properties (2)

    sessionEngines: { [key: string]: SessionEngine; };
    updateSessions?: (sessionEngines: { [key: string]: SessionEngine; }) => void;

    // #endregion Properties (2)

    // #region Public Methods (6)

    applySettings(sessionId: string, response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void>;
    closeSessionEngine(id: string): Promise<void>;
    createSessionEngine(properties: SessionCreationDefinition): Promise<SessionEngine>;
    resetSettings(sessionId: string, sections?: ISettingsSections): Promise<void>;
    saveSettings(sessionId: string, viewportId?: string): Promise<boolean>;

    // #endregion Public Methods (6)
}

// #endregion Interfaces (1)
