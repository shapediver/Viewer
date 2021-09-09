import { ShapeDiverResponseBase } from '@shapediver/api.geometry-api-dto-v1'
import { IEvent, LOGGINGLEVEL, MAINEVENTTYPE } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { Tree } from '@shapediver/viewer.shared.node-tree'

import { ISession } from './session/ISession'
import { IViewer } from './viewer/IViewer'

export interface IApi {
  // #region Properties (10)

  readonly sceneTree: Tree;
  readonly sessions: { [key: string]: ISession };
  readonly viewers: { [key: string]: IViewer };

  autoScaling: boolean;
  enableAR: boolean;
  globalRotation: vec3;
  globalScale: vec3;
  globalTranslation: vec3;
  loggingLevel: LOGGINGLEVEL;
  showMessages: boolean;

  // #endregion Properties (10)

  // #region Public Methods (11)

  /**
   * Adds an event listener.
   * 
   * @param type the type of event
   * @param cb the callback
   * @returns 
   */
  addListener(type: string | MAINEVENTTYPE, cb: (event: IEvent) => void): string;

  /**
   * Update all or some settings of the primary session and the viewers via a ShapeDiverResponseBase of another model.
   * 
   * @param response 
   * @param sections 
   */
  applySettings( response: ShapeDiverResponseBase, sections: { session: { parameter: { displayname: boolean, order: boolean, hidden: boolean }, export: { displayname: boolean, order: boolean, hidden: boolean } }, viewer: { scene: boolean, camera: boolean, light: boolean, environment: boolean } }): Promise<void>;
  
  /**
   * Closes the session with the specified id.
   * The geometry will be removed and the settings will be reset (if this session was used for the settings).
   * The session cannot be used further.
   * 
   * @param id the id of the session
   * @returns 
   */
  closeSession(id: string): Promise<boolean>;
  
  /**
   * Closes the viewer with the specified id.
   * 
   * @param id the id of the viewer
   * @returns 
   */
  closeViewer(id: string): Promise<boolean>;
  
  /**
   * Converts the whole scene (without the groundplane or grid) into a GlTF v2.
   * 
   * @returns
   */
  convertSceneToGLTF(): Promise<Blob>;
  
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
   * @param properties.primarySession the bearerToken of the session
   * @param properties.id the unique id the session should have
   * @returns 
   */
  createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, id?: string, excludeViewers?: string[] }): Promise<ISession>;
  

  /**
   * Create and initialize a viewer with the provided type and canvas.
   * An id can be provided. This id can be used to retrieve this object later on.
   * In the case no id has been provided, a unique one will be generated.
   * 
   * The viewer will automatically load what is currently in the scene tree.
   * 
   * @param properties.type the type of the viewer
   * @param properties.visibility the visibility of the viewer
   * @param properties.canvas the canvas that the viewer should use
   * @param properties.id the unique id the session should have 
   * @param properties.logo an optional logo while the viewer is hidden
   * @returns 
   */
  createViewer(properties?: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, logo?: string }): Promise<IViewer>;
  
  /**
   * Removes an event listener.
   * 
   * @param id the id of the listener
   * @returns 
   */
  removeListener(id: string): boolean;
  
  /**
   * Update all viewers.
   * The viewers are updated with all current changes in the scene tree.
   */
  update(): void;
  
  /**
   * View the current scene in AR.
   * 
   * Please check first if the device supports the viewing of models in AR, see {@link viewableInAR}.
   * 
   * As some models might have a different scale then the AR apps (meters), the scaling can be chosen freely.
   * By default the {@link autoScaling} option is enabled to scale the model so that the largest bounding boy side is 1 meter.
   * If you disable that option, you can chose your own scaling factor via {@link globalScale}.
   * 
   * @param androidOptions 
   */
  viewInAR(androidOptions: { title?: string, resizable?: boolean, fallback_url?: string }): Promise<void>;
  
  /**
   * Determines if the current devices supports the viewing in AR.
   * 
   * An error will be thrown with debugging information if it is not possible.
   */
  viewableInAR(): boolean;

  // #endregion Public Methods (11)
}