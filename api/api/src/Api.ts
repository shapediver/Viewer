import { Tree } from "@shapediver/viewer.shared.node-tree";
import { container, singleton } from "tsyringe";
import { Session } from "./session/Session";
import { Viewer } from "./viewer/Viewer";
import { StateEngine, EventEngine, EVENTTYPE, MAINEVENTTYPE, SettingsEngine } from '@shapediver/viewer.shared.services';
import { UuidGenerator, InputValidator } from '@shapediver/viewer.shared.utils';
import { RENDERERTYPE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { Logger, PerformanceEvaluator, LOGGINGLEVEL } from "@shapediver/viewer.shared.monitoring";
import { VISIBILITYMODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { build_data } from "./build_data";

@singleton()
export class Api {
  // #region Properties (8)

  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
  readonly #sessionCallbacks: { [key: string]: { [key: string]: () => any } } = {};
  readonly #sessions: { [key: string]: Session } = {};
  readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #viewerCallbacks: { [key: string]: { [key: string]: () => any } } = {};
  readonly #viewers: { [key: string]: Viewer } = {};

  // #endregion Properties (8)

  // #region Constructors (1)

  /**
   * @ignore
   */
  constructor() {
    this.#stateEngine.primarySettingsRegistered.then(() => {
      this.#logger.showMessages = this.#settingsEngine.general.viewer.showMessages.value;
    })
    this.#logger.info(`Viewer version: ${build_data.build_version}`);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (5)

  /**
   * The loggingLevel setting.
   * @return {LOGGINGLEVEL}
   */
  public get loggingLevel(): LOGGINGLEVEL {
    return this.#logger.loggingLevel;
  }

  /**
   * The loggingLevel setting.
   * @param {LOGGINGLEVEL} value
   */
  public set loggingLevel(value: LOGGINGLEVEL) {
    this.#inputValidator.validate(value, 'enum', true, Object.values(LOGGINGLEVEL));
    this.#logger.loggingLevel = value;
    this.#logger.info(`LoggingLevel was set to: ${value}`);
  }

  /**
   * The scene tree.
   * Please see TODO for more information.
   */
  public get sceneTree(): Tree {
    return <Tree>container.resolve(Tree);
  }

  /**
   * The showMessages setting.
   * @return {boolean}
   */
  public get showMessages(): boolean {
    return this.#logger.showMessages;
  }

  /**
   * The showMessages setting.
   * @param {boolean} value
   */
  public set showMessages(value: boolean) {
    this.#inputValidator.validate(value, 'boolean');
    this.#logger.showMessages = value;
    this.#settingsEngine.general.viewer.showMessages.value = this.#logger.showMessages;
    this.#logger.info(`ShowMessages was set to: ${value}`);
  }

  // #endregion Public Accessors (5)

  // #region Public Methods (11)

  /**
   * Adds an event listener.
   * 
   * @param type the type of event
   * @param cb the callback
   * @returns 
   */
  public addListener(type: string | MAINEVENTTYPE, cb: (event: any) => {}): string {
    return this.#eventEngine.addListener(type, cb);
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
    this.#inputValidator.validate(id, 'string');
    if(!this.#sessions[id]) {
      this.#logger.info(`Session with id ${id} was not registered`);
      return false;
    }
    const result = await this.#sessionCallbacks[id].close();

    if(this.#sessions[id].primarySession) {
      for(let v in this.#viewers)
        this.#viewers[v].reset();
    }
    this.update();

    (<any>this.#sessionCallbacks[id]) = undefined;
    delete this.#sessionCallbacks[id];
    (<any>this.#sessions[id]) = undefined;
    delete this.#sessions[id];

    this.#logger.info(`Session (${id}): Session closed.`);

    for(let s in this.#sessions) {
      const session = this.#sessions[s];
      if(session.primarySessionRequest) {
        await this.#sessionCallbacks[s].setAsPrimary();
        this.#logger.info(`Session (${s}): Initializing settings.`);
        break;
      }
    }

    return result;
  }

  /**
   * Closes the viewer with the specified id.
   * 
   * @param id the id of the viewer
   * @returns 
   */
   public async closeViewer(id: string): Promise<boolean> {
    this.#inputValidator.validate(id, 'string');
    if(!this.#viewers[id]) {
      this.#logger.info(`Viewer with id ${id} was not registered`);
      return false;
    }
    const result = await this.#viewerCallbacks[id].close();

    (<any>this.#viewerCallbacks[id]) = undefined;
    delete this.#viewerCallbacks[id];
    (<any>this.#viewers[id]) = undefined;
    delete this.#viewers[id];

    this.#logger.info(`Viewer (${id}): Viewer closed.`);
    return result;
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
  public async createAndInitializeSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, returnDTOs?: boolean, id?: string, excludeViewers?: string[] }): Promise<Session> {
    // input validation
    this.#inputValidator.validate(properties, 'object');
    this.#inputValidator.validate(properties.ticket, 'string');
    this.#inputValidator.validate(properties.modelViewUrl, 'string');
    this.#inputValidator.validate(properties.bearerToken, 'string', false);
    this.#inputValidator.validate(properties.primarySession, 'boolean', false);
    this.#inputValidator.validate(properties.returnDTOs, 'boolean', false);
    this.#inputValidator.validate(properties.excludeViewers, 'stringArray', false);
    this.#inputValidator.validate(properties.id, 'string', false);
    
    // check if the given id is valid
    const sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#sessions[sessionId]) {
      this.#logger.error('Session with this id already exists.');
      throw new Error('Session with this id already exists.');
    }

    const session = this.createSession(properties);
    await session.init();
    return session;
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
  public createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, returnDTOs?: boolean, id?: string, excludeViewers?: string[] }): Session {
    // input validation
    this.#inputValidator.validate(properties, 'object');
    this.#inputValidator.validate(properties.ticket, 'string');
    this.#inputValidator.validate(properties.modelViewUrl, 'string');
    this.#inputValidator.validate(properties.bearerToken, 'string', false);
    this.#inputValidator.validate(properties.primarySession, 'boolean', false);
    this.#inputValidator.validate(properties.returnDTOs, 'boolean', false);
    this.#inputValidator.validate(properties.excludeViewers, 'stringArray', false);
    this.#inputValidator.validate(properties.id, 'string', false);

    // check if the given id is valid
    const sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#sessions[sessionId]) {
      this.#logger.error('Session with this id already exists.');
      throw new Error('Session with this id already exists.');
    }

    // start the performance eval
    this.#performanceEvaluator.start('session_creation_' + sessionId);

    // create the actual session 
    let sessionCallbacks = {};
    const session = new Session(Object.assign({}, properties, { id: sessionId }), sessionCallbacks);
    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { session });

    // save the session
    this.#sessions[sessionId] = session;
    this.#sessionCallbacks[sessionId] = sessionCallbacks;

    // end the performance eval
    this.#performanceEvaluator.end('session_creation_' + sessionId);
    this.#logger.info(this.#performanceEvaluator.getEvaluationToString('session_creation_' + sessionId));

    return session;
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
   * @returns 
   */
  public createViewer(properties: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas: HTMLCanvasElement, id?: string }): Viewer {
    // input validation
    this.#inputValidator.validate(properties, 'object');
    this.#inputValidator.validate(properties.type, 'enum', false, Object.values(RENDERERTYPE));
    this.#inputValidator.validate(properties.visibility, 'enum', false, Object.values(VISIBILITYMODE));
    this.#inputValidator.validate(properties.canvas, 'HTMLCanvasElement');
    this.#inputValidator.validate(properties.id, 'string', false);

    // check if the given id is valid
    const viewerId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#viewers[viewerId]) this.#logger.error('Viewer with this id already exists.');

    // start the performance eval
    this.#performanceEvaluator.start('viewer_creation_' + viewerId);

    // create the actual viewer
    let viewerCallbacks = {};
    const viewer = new Viewer({ id: viewerId, canvas: properties.canvas, visibility: properties.visibility || VISIBILITYMODE.SESSION, type: properties.type || RENDERERTYPE.STANDARD }, viewerCallbacks);
    this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewer });

    // save the viewer
    this.#viewers[viewerId] = viewer;
    this.#viewerCallbacks[viewerId] = viewerCallbacks;

    // update the viewer with the current scene tree
    viewer.update();

    // end the performance eval
    this.#performanceEvaluator.end('viewer_creation_' + viewerId);
    this.#logger.info(this.#performanceEvaluator.getEvaluationToString('viewer_creation_' + viewerId));

    return this.#viewers[viewerId];
  }

  /**
   * Return the session with the specified id.
   * 
   * @param id the id of the session
   * @returns 
   */
  public getSession(id: string): Session {
    this.#inputValidator.validate(id, 'string');
    return this.#sessions[id];
  }

  /**
   * Retrun all sessions as key-value pairs with the id of the session being the key.
   * 
   * @returns 
   */
  public getSessions(): { [key: string]: Session } {
    const r: { [key: string]: Session } = {};
    for (let s in this.#sessions)
      r[s] = this.#sessions[s];
    return r;
  }

  /**
   * Return the viewer with the specified id.
   * 
   * @param id the id of the viewer
   * @returns 
   */
  public getViewer(id: string): Viewer {
    this.#inputValidator.validate(id, 'string');
    return this.#viewers[id];
  }

  /**
   * Return all viewers as key-value pairs with the id of the viewer being the key.
   * 
   * @returns 
   */
  public getViewers(): { [key: string]: Viewer } {
    const r: { [key: string]: Viewer } = {};
    for (let v in this.#viewers)
      r[v] = this.#viewers[v];
    return r;
  }

  /**
   * Removes an event listener.
   * 
   * @param id the id of the listener
   * @returns 
   */
  public removeListener(id: string): boolean {
    return this.#eventEngine.removeListener(id);
  }

  /**
   * Update all viewers.
   * The viewers are updated with all current changes in the scene tree.
   */
  public update(): void {
    for(let v in this.#viewers)
      this.#viewers[v].update();
  }

  // #endregion Public Methods (11)
}