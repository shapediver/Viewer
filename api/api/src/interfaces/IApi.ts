import { IEvent, LOGGINGLEVEL, MAINEVENTTYPE } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'

import { ISession } from './session/ISession'
import { IViewer } from './viewer/IViewer'
import { SDTFOverview } from '@shapediver/viewer.shared.types'
import { ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2'

export interface IApi {
  // #region Properties (11)

  readonly sceneTree: Tree;
  readonly sessions: { [key: string]: ISession };
  readonly viewers: { [key: string]: IViewer };

  automaticUpdate: boolean;
  enableAR: boolean;
  globalRotation: vec3;
  globalScale: vec3;
  globalTranslation: vec3;
  loggingLevel: LOGGINGLEVEL;
  showMessages: boolean;

  // #endregion Properties (11)

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
  applySettings( response: ShapeDiverResponseDto, sections?: { 
    session?: { 
      parameter?: { displayname?: boolean, order?: boolean, hidden?: boolean },
      export?: { displayname?: boolean, order?: boolean, hidden?: boolean }
    },
    viewer?: { scene?: boolean, camera?: boolean, light?: boolean, environment?: boolean }
  }): Promise<void>;
  /**
   * Closes the session with the specified id.
   * The geometry will be removed and the settings will be reset (if this session was used for the settings).
   * The session cannot be used further.
   * 
   * @param id the id of the session
   * @param force optional setting to force closing
   * @returns 
   */
  closeSession(id: string, force?: boolean): Promise<boolean>;
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
   * @param properties.waitForOutputs if the promise should resolve before or after the outputs are loaded
   * @param properties.loadOutputs if set to false, the outputs are not loaded at all
   * @param properties.initialParameters initial set of parameters
   * @returns 
   */
  createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, id?: string, excludeViewers?: string[], waitForOutputs?: boolean, loadOutputs?: boolean, initialParameters?: { [key: string]: string } }): Promise<ISession>;
  
  /**
   * Create the {@link SDTFOverview} for the provided node.
   * If no node was provided, the scene root is used instead.
   * 
   * @param node 
   */
  createSDTFOverview(node: TreeNode): SDTFOverview;

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
   * @param properties.branding optional branding options while the viewer is hidden
   * @param properties.branding.logo optional logo while the viewer is hidden (our default will be used if none is provided, null will display no logo at all)
   * @param properties.branding.backgroundColor optional background color while the viewer is hidden, can include alpha channel (our default will be used if none is provided)
   * @returns 
   */
  createViewer(properties?: { visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, branding?: { logo?: string | null, backgroundColor?: string } }): Promise<IViewer>;
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
   * 
   * @param androidOptions 
   */
  viewInAR(options?: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean }): Promise<void>;
  /**
   * Determines if the current devices supports the viewing in AR.
   */
  viewableInAR(): boolean;

  // #endregion Public Methods (11)
}