import { ShapeDiverResponseBase } from '@shapediver/api.geometry-api-dto-v1'
import { IEvent, LOGGINGLEVEL, MAINEVENTTYPE } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { Tree } from '@shapediver/viewer.shared.node-tree'

import { ISession } from './session/ISession'

export interface IApi {
  // #region Properties (10)

  readonly sceneTree: Tree;
  readonly sessions: { [key: string]: ISession };

  automaticUpdate: boolean;
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
   * Removes an event listener.
   * 
   * @param id the id of the listener
   * @returns 
   */
  removeListener(id: string): boolean;

  // #endregion Public Methods (11)
}