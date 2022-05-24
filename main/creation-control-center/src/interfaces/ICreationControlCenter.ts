import { IRenderingEngineOptions, SESSION_SETTINGS_MODE, VISIBILITY_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { ISessionEngineOptions, SessionEngine } from "@shapediver/viewer.session-engine.session-engine";

export interface ICreationControlCenter {
  // #region Public Methods (4)

  renderingEngines: { [key: string]: RenderingEngineThreeJs; }
  sessionEngines: { [key: string]: SessionEngine; }

  update?: (
    sessionEngines: { [key: string]: SessionEngine; }, 
    renderingEngines: { [key: string]: RenderingEngineThreeJs; }
  ) => void;

  /**
   * Closes the session with the specified id.
   * The geometry will be removed and the settings will be reset (if this session was used for the settings).
   * The session cannot be used further.
   * 
   * @param id the id of the session
   * @returns 
   */
  closeSessionEngine(id: string): Promise<void>;

  /**
   * Closes the viewer with the specified id.
   * 
   * @param id the id of the viewer
   * @returns 
   */
  closeRenderingEngine(id: string): Promise<void>;

  /**
   * Create and initialize a session with the provided ticket and modelViewUrl.
   * An id can be provided. This id can be used to retrieve this object later on.
   * In the case no id has been provided, a unique one will be generated.
   *
   * A bearerToken can be provided (JWT).
   *
   * The session will be initialized automatically,
   * and the first computation will be loaded in the the scene tree once the promise has resolved.
   *
   * @param properties.ticket the ticket of a session
   * @param properties.modelViewUrl the modelViewUrl of the session
   * @param properties.bearerToken the bearerToken of the session
   * @param properties.id the unique id the session should have
   * @param properties.waitForOutputs if the promise should resolve before or after the outputs are loaded
   * @param properties.loadOutputs if set to false, the outputs are not loaded at all
   * @param properties.initialParameters initial set of parameters
   * @returns
   */
  createSessionEngine(properties: ISessionEngineOptions): Promise<SessionEngine>;

  /**
   * Create and initialize a viewer with the provided type and canvas.
   * An id can be provided. This id can be used to retrieve this object later on.
   * In the case no id has been provided, a unique one will be generated.
   * 
   * The viewer will automatically load what is currently in the scene tree.
   * 
   * @param properties.visibility the visibility of the viewer
   * @param properties.canvas the canvas that the viewer should use
   * @param properties.id the unique id the session should have 
   * @param properties.branding optional branding options while the viewer is hidden
   * @param properties.branding.logo optional logo while the viewer is hidden (our default will be used if none is provided, null will display no logo at all)
   * @param properties.branding.backgroundColor optional background color while the viewer is hidden, can include alpha channel (our default will be used if none is provided)
   * @returns 
   */
   createRenderingEngineThreeJs(properties: IRenderingEngineOptions): Promise<RenderingEngineThreeJs>;

  // #endregion Public Methods (4)
}