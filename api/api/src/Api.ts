import { Tree } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { EventEngine, EVENTTYPE, IEvent, ISessionEvent, MAINEVENTTYPE, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine'
import { InputValidator, UuidGenerator } from '@shapediver/viewer.shared.utils'
import { RENDERERTYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { Logger, LOGGINGLEVEL, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'
import { VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { SDError } from '@shapediver/viewer.shared.utils'

import { Session } from './session/Session'
import { Viewer } from './viewer/Viewer'

@singleton()
export class Api {
  // #region Properties (15)

  readonly #defaultLogo: string = 'https://d2tuv7fwq0eipl.cloudfront.net/production/assets/img/icon_logo_white.png';
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #geometryEngine: GeometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionCallbacks: { [key: string]: { [key: string]: () => any } } = {};
  readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #updateCB = () => {
    (<any>this.loggingLevel) = this.#logger.loggingLevel;
    (<any>this.showMessages) = this.#logger.showMessages;
  }

  readonly #viewerCallbacks: { [key: string]: { [key: string]: () => any } } = {};
  readonly loggingLevel!: LOGGINGLEVEL;
  readonly sceneTree: Tree = <Tree>container.resolve(Tree);
  readonly sessions: { [key: string]: Session } = {};
  readonly showMessages!: boolean;
  readonly viewers: { [key: string]: Viewer } = {};

  // #endregion Properties (15)

  // #region Constructors (1)

  /**
   * @ignore
   */
  constructor() {
    try {
      this.#stateEngine.primarySettingsRegistered.then(() => {
        this.#logger.showMessages = this.#settingsEngine.general.viewer.showMessages.value;
      })
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Viewer version: ${build_data.build_version}`);
      this.#logger.addUpdateCB(this.#updateCB);
      this.#updateCB();

      this.#eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, (e) => { 
        const sessionEvent: ISessionEvent = <ISessionEvent>e;
        if(sessionEvent.sessionId)
          if(this.sessions[sessionEvent.sessionId].primarySession)
            this.#stateEngine.primarySettingsRegistered.resolve(true);
        if(sessionEvent.sessionId) 
          this.#stateEngine.getCustomState((<any>e).sessionId + '_settings_registered').resolve(true);
      })
      this.#eventEngine.addListener(EVENTTYPE.SESSION.SESSION_INITIALIZED, (e) => { 
        const sessionEvent: ISessionEvent = <ISessionEvent>e;
        if(sessionEvent.sessionId)
          if(this.sessions[sessionEvent.sessionId].primarySession) this.#stateEngine.primarySessionLoaded.resolve(true);
      })

      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.constructor: Api created.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, new SDError(e.message, e), `Api.constructor: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)

  // #region Public Methods (15)

  /**
   * Adds an event listener.
   * 
   * @param type the type of event
   * @param cb the callback
   * @returns 
   */
  public addListener(type: string | MAINEVENTTYPE, cb: (event: IEvent) => void): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
      return this.#eventEngine.addListener(type, cb);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, new SDError(e.message, e), `Api.addListener: Something unexpected happened.`, true)
    }
  }

  /**
   * Closes the session with the specified id.
   * The geometry will be removed and the settings will be reset (if this session was used for the settings).
   * The session cannot be used further.
   * 
   * @param id the id of the session
   * @returns 
   */
  public async closeSession(id: string): Promise<boolean> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.closeSession: Closing session ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, 'Api.closeSession', id, 'string');
      if (!this.sessions[id])
        this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(`Api.closeSession: Session with id ${id} was not registered.`));

      const result = await this.#sessionCallbacks[id].close();
      if(this.#stateEngine.getCustomState(id + '_settings_registered'))
        this.#stateEngine.getCustomState(id + '_settings_registered').reset();

      if (this.sessions[id].primarySession) {
        this.#stateEngine.primarySessionLoaded.reset();
        this.#stateEngine.primarySettingsRegistered.reset();
        this.#stateEngine.boundingBoxCreated.reset();
        for (let v in this.viewers)
          this.viewers[v].reset();
      }

      (<any>this.#sessionCallbacks[id]) = undefined;
      delete this.#sessionCallbacks[id];
      (<any>this.sessions[id]) = undefined;
      delete this.sessions[id];

      this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${id}): Session closed.`);

      for (let s in this.sessions) {
        const session = this.sessions[s];
        if (session.primarySessionRequest) {
          await this.#sessionCallbacks[s].setAsPrimary();
          this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${s}): Initializing settings.`);
          break;
        }
      }

      return result;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Api.closeSession: Something unexpected happened.`, true)
    }
  }

  /**
   * Closes the viewer with the specified id.
   * 
   * @param id the id of the viewer
   * @returns 
   */
  public async closeViewer(id: string): Promise<boolean> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.closeViewer: Closing viewer ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.closeViewer', id, 'string');
      if (!this.viewers[id]) {
        this.#logger.info(LOGGINGTOPIC.VIEWER, `Api.closeViewer: Viewer with id ${id} was not registered`);
        return false;
      }

      if(this.#stateEngine.getCustomState(id + '_settings_loaded'))
        this.#stateEngine.getCustomState(id + '_settings_loaded').reset();
      this.#stateEngine.firstViewerShown.reset();
      const result = await this.#viewerCallbacks[id].close();
      (<any>this.#viewerCallbacks[id]) = undefined;
      delete this.#viewerCallbacks[id];
      (<any>this.viewers[id]) = undefined;
      delete this.viewers[id];

      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${id}): Viewer closed.`);
      return result;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.closeViewer: Something unexpected happened.`, true)
    }
  }

  /**
   * Converts the whole scene (without the groundplane or grid) into a GlTF v2.
   * 
   * @returns
   */
  public async convertSceneToGLTF(): Promise<Blob> {
    try {
      const result = await this.#geometryEngine.convertSceneToGLTF(this.sceneTree.root);
      return new Blob([result], { type: 'application/octet-stream' });
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.convertSceneToGLTF: Something unexpected happened.`, true)
    }
  }

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
  public async createAndInitializeSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, id?: string, excludeViewers?: string[] }): Promise<Session> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`);
      // input validation
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties, 'object');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties.ticket, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties.modelViewUrl, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties.bearerToken, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties.primarySession, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties.excludeViewers, 'stringArray', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession`, properties.id, 'string', false);

      // check if the given id is valid
      const sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.sessions[sessionId])
        throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(`Api.createAndInitializeSession: Session with this id (${sessionId}) already exists.`));

      const session = this.createSession(properties);
      await session.init();
      this.#logger.info(LOGGINGTOPIC.SESSION, `Api.createAndInitializeSession: Session(${session.id}) created and initialized.`);
      return session;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Api.createAndInitializeSession: Something unexpected happened.`, true)
    }
  }

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
  public async createAndInitializeViewer(properties?: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, logo?: string }): Promise<Viewer> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer: Creating and initializing viewer with properties ${JSON.stringify(properties)}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.createAndInitializeViewer', properties, 'object', false);
      const prop = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer`, prop.type, 'enum', false, Object.values(RENDERERTYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer`, prop.visibility, 'enum', false, Object.values(VISIBILITYMODE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer`, prop.canvas, 'HTMLCanvasElement', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer`, prop.id, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer`, prop.logo, 'string', false);

      // check if the given id is valid
      const viewerId = prop.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.viewers[viewerId])
        throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(`Api.createAndInitializeViewer: Viewer with this id (${viewerId}) already exists.`));

      // create the actual viewer
      let viewerCallbacks = {};
      const viewer = new Viewer({ id: viewerId, canvas: prop.canvas, visibility: prop.visibility || VISIBILITYMODE.SESSION, type: prop.type || RENDERERTYPE.STANDARD, logo: prop.logo || this.#defaultLogo }, viewerCallbacks);
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewerId });

      // save the viewer
      this.viewers[viewerId] = viewer;
      this.#viewerCallbacks[viewerId] = viewerCallbacks;

      // init and update the viewer with the current scene tree
      await viewer.init(prop);
      viewer.update();
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_INITIALIZED, { viewerId });

      this.#logger.info(LOGGINGTOPIC.VIEWER, `Api.createAndInitializeViewer: Viewer(${viewer.id}) created and initialized.`);
      return this.viewers[viewerId];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.createAndInitializeViewer: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a session with the provided ticket and modelViewUrl.
   * An id can be provided. This id can be used to retrieve this object later on.
   * In the case no id has been provided, a unique one will be generated.
   * 
   * A bearerToken can be provided (JWT).
   * 
   * @param properties.ticket the ticket of a session
   * @param properties.modelViewUrl the modelViewUrl of the session
   * @param properties.bearerToken the bearerToken of the session
   * @param properties.primarySession the bearerToken of the session
   * @param properties.id the unique id the session should have
   * @returns 
   */
  public createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, id?: string, excludeViewers?: string[] }): Session {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.createSession: Creating session with properties ${JSON.stringify(properties)}.`);
      // input validation
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties, 'object');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.ticket, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.modelViewUrl, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.bearerToken, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.primarySession, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.excludeViewers, 'stringArray', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.id, 'string', false);

      // check if the given id is valid
      const sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.sessions[sessionId])
        throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(`Api.createSession: Session with this id (${sessionId}) already exists.`));

      // create the actual session 
      let sessionCallbacks = {};
      const session = new Session(Object.assign({}, properties, { id: sessionId }), sessionCallbacks);
      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { sessionId });

      // save the session
      this.sessions[sessionId] = session;
      this.#sessionCallbacks[sessionId] = sessionCallbacks;

      this.#logger.info(LOGGINGTOPIC.SESSION, `Api.createSession: Session(${session.id}) created.`);
      return session;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Api.createSession: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a viewer with the provided type and canvas.
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
  public createViewer(properties?: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, logo?: string }): Viewer {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.createViewer: Creating viewer with properties ${JSON.stringify(properties)}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.createViewer', properties, 'object', false);
      const prop = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.type, 'enum', false, Object.values(RENDERERTYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.visibility, 'enum', false, Object.values(VISIBILITYMODE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.canvas, 'HTMLCanvasElement', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.id, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.logo, 'string', false);

      // check if the given id is valid
      const viewerId = prop.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.viewers[viewerId])
        throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(`Api.createViewer: Viewer with this id (${viewerId}) already exists.`));

      // create the actual viewer
      let viewerCallbacks = {};
      const viewer = new Viewer({ id: viewerId, canvas: prop.canvas, visibility: prop.visibility || VISIBILITYMODE.SESSION, type: prop.type || RENDERERTYPE.STANDARD, logo: prop.logo || this.#defaultLogo }, viewerCallbacks);
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewerId });

      // save the viewer
      this.viewers[viewerId] = viewer;
      this.#viewerCallbacks[viewerId] = viewerCallbacks;

      this.#logger.info(LOGGINGTOPIC.VIEWER, `Api.createViewer: Viewer(${viewer.id}) created.`);
      return this.viewers[viewerId];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.createViewer: Something unexpected happened.`, true)
    }
  }

  /**
   * Return the session with the specified id.
   * 
   * @param id the id of the session
   * @returns 
   */
  public getSession(id: string): Session | null {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.getSession: Getting session with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, 'Api.getSession', id, 'string');
      return this.sessions[id];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Api.getSession: Something unexpected happened.`, true)
    }
  }

  /**
   * Return the viewer with the specified id.
   * 
   * @param id the id of the viewer
   * @returns 
   */
  public getViewer(id: string): Viewer | null {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.getViewer: Getting viewer with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.getViewer', id, 'string');
      return this.viewers[id];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.getViewer: Something unexpected happened.`, true)
    }
  }

  /**
   * Removes an event listener.
   * 
   * @param id the id of the listener
   * @returns 
   */
  public removeListener(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.removeListener: Removing event listener with id ${id}.`);
      return this.#eventEngine.removeListener(id);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, new SDError(e.message, e), `Api.removeListener: Something unexpected happened.`, true)
    }
  }

  /**
   * Update all viewers.
   * The viewers are updated with all current changes in the scene tree.
   */
  public update(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.update: Updating all viewers.`);
      for (let v in this.viewers)
        this.viewers[v].update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.update: Something unexpected happened.`, true)
    }
  }

  /**
   * The loggingLevel setting.
   * @param {LOGGINGLEVEL} value
   */
  public updateLoggingLevel(value: LOGGINGLEVEL) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.updateLoggingLevel: Updating LoggingLevel to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.updateLoggingLevel', value, 'enum', true, Object.values(LOGGINGLEVEL));
      this.#logger.loggingLevel = value;
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.updateLoggingLevel: LoggingLevel was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, new SDError(e.message, e), `Api.updateLoggingLevel: Something unexpected happened.`, true)
    }
  }

  /**
   * The showMessages setting.
   * @param {boolean} value
   */
  public updateShowMessages(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.updateShowMessages: Updating ShowMessages to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.updateShowMessages', value, 'boolean');
      this.#logger.showMessages = value;
      this.#settingsEngine.general.viewer.showMessages.value = this.#logger.showMessages;
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.updateShowMessages: ShowMessages was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, new SDError(e.message, e), `Api.updateShowMessages: Something unexpected happened.`, true)
    }
  }

  public async viewInAR(title: string = '', mode: '3d_preferred' | '3d_only' | 'ar_preferred' | 'ar_only' = 'ar_only', resizable = false, browser_fallback_url = 'https://shapediver.com/'): Promise<void> {
    try {
      let arSession;
      for(let s in this.sessions)
        if(this.sessions[s].canUploadGLTF)
          arSession = this.sessions[s];
      if(!arSession) throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError('None of the sessions that are registered are capable of using the AR feature.'), 'None of the sessions that are registered are capable of using the AR feature.', true);
      
      const file = await arSession.uploadGLTF();
      const a = document.createElement('a');
      a.href = `intent://arvr.google.com/scene-viewer/1.0?resizable=${resizable}&title=${title}&file=${file}&mode=${mode}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${browser_fallback_url};end;`
      document.body.appendChild(a)
      a.click()
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, new SDError(e.message, e), `Api.viewInAR: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Methods (15)
}