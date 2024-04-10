import { BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING, VISIBILITY_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import { ISettingsSections, SessionEngine } from '@shapediver/viewer.session-engine.session-engine';
import { ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ISettings } from '@shapediver/viewer.settings';

// #region Type aliases (2)

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
  /** Option to load the outputs, or not load them until the first call of {@link ISessioncustomize}. (default: true) */
  loadOutputs?: boolean,
  /** Option to exclude some viewports from the start. Can be accessed via {@link ISessionexcludeViewports}. */
  excludeViewports?: string[],
  /** The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified. */
  initialParameterValues?: { [key: string]: string }
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

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface ICreationControlCenter {
  // #region Properties (4)

  renderingEngines: { [key: string]: RenderingEngineThreeJs; }

  sessionEngines: { [key: string]: SessionEngine; }

  updateSessions?: (sessionEngines: { [key: string]: SessionEngine; }) => void;
  updateViewports?: (renderingEngines: { [key: string]: RenderingEngineThreeJs; }) => void;

  // #endregion Properties (4)

  // #region Public Methods (10)

  applySettings(sessionId: string, response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void>;
  applyViewportSettings(viewportId: string, settings: ISettings, sections?: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; postprocessing?: boolean | undefined }): Promise<void>;
  closeRenderingEngine(id: string): Promise<void>;
  closeSessionEngine(id: string): Promise<void>;
  createRenderingEngineThreeJs(properties: ViewportCreationDefinition): Promise<RenderingEngineThreeJs>;
  createSessionEngine(properties: SessionCreationDefinition): Promise<SessionEngine>;
  getARSessionEngine(): SessionEngine | undefined;
  getViewportSettings(viewportId: string): ISettings;
  resetSettings(sessionId: string, sections?: ISettingsSections): Promise<void>;
  saveSettings(sessionId: string, viewportId?: string): Promise<boolean>;

  // #endregion Public Methods (10)
}

// #endregion Interfaces (1)
