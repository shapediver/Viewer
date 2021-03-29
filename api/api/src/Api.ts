import { Tree } from "@shapediver/viewer.shared.node-tree";
import { container, singleton } from "tsyringe";
import { Session } from "./session/Session";
import { Viewer } from "./viewer/Viewer";
import { StateEngine, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { RENDERERTYPE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";

@singleton()
export class Api {
  
  // TODO
  #commitSettings: boolean = false;
  #loggingLevel: number = -1;
  #showMessages: boolean = true;

  readonly #performanceEvaluator: PerformanceEvaluator;
  readonly #logger: Logger;
  readonly #eventEngine: EventEngine;
  readonly #sessions: { [key: string]: Session } = {};
  readonly #viewers: { [key: string]: Viewer } = {};
  // #region Constructors (1)

  /**
   * @ignore
   */
  constructor() {
    const stateEngine = <StateEngine>container.resolve(StateEngine);
    this.#performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    this.#logger = <Logger>container.resolve(Logger);
    this.#eventEngine = <EventEngine>container.resolve(EventEngine);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (7)

  // /**
  //  * Getter commitSettings
  //  * @return {boolean}
  //  */
  // public get commitSettings(): boolean {
  //   return this.#commitSettings;
  // }

  // /**
  //  * Setter commitSettings
  //  * @param {boolean} value
  //  */
  // public set commitSettings(value: boolean) {
  //   this.#commitSettings = value;
  // }

  // /**
  //  * Getter loggingLevel
  //  * @return {number}
  //  */
  // public get loggingLevel(): number {
  //   return this.#loggingLevel;
  // }

  // /**
  //  * Setter loggingLevel
  //  * @param {number} value
  //  */
  // public set loggingLevel(value: number) {
  //   this.#loggingLevel = value;
  // }

  /**
   * The scene tree.
   * Please see TODO for more information.
   */
  public get sceneTree(): Tree {
    return <Tree>container.resolve(Tree);
  }

  // /**
  //  * Getter showMessages
  //  * @return {boolean}
  //  */
  // public get showMessages(): boolean {
  //   return this.#showMessages;
  // }

  // /**
  //  * Setter showMessages
  //  * @param {boolean} value
  //  */
  // public set showMessages(value: boolean) {
  //   this.#showMessages = value;
  // }

  // #endregion Public Accessors (7)

  // #region Public Methods (7)

  /**
   * Create a session with the provided ticket and modelViewUrl.
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
   * @param properties.loadDefaultSettings the bearerToken of the session
   * @param properties.id the unique id the session should have
   * @returns 
   */
  public async createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, loadDefaultSettings?: boolean, id?: string }): Promise<Session> {
    // check if the given id is valid
    const sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#sessions[sessionId]) this.#logger.error('Session with this id already exists.');

    // start the performance eval
    this.#performanceEvaluator.start('session_creation_' + sessionId);

    // create the actual session 
    const session = new Session(sessionId, properties.ticket, properties.modelViewUrl, properties.bearerToken, properties.loadDefaultSettings);
    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { session });

    // initialized the session
    await session.init()
    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session });

    // save the session
    this.#sessions[sessionId] = session;
    container.registerInstance('session', session);

    // end the performance eval
    this.#performanceEvaluator.end('session_creation_' + sessionId);
    this.#logger.info(this.#performanceEvaluator.getEvaluationToString('session_creation_' + sessionId));

    return this.#sessions[sessionId];
  }

  /**
   * Create a viewer with the provided type and canvas.
   * An id can be provided. This id can be used to retrieve this object later on.
   * In the case no id has been provided, a unique one will be generated.
   * 
   * The viewer will automatically load what is currently in the scene tree.
   * 
   * @param properties.type the type of the viewer
   * @param properties.canvas the canvas that the viewer should use
   * @param properties.id the unique id the session should have 
   * @returns 
   */
  public async createViewer(properties: { type?: RENDERERTYPE, canvas: HTMLCanvasElement, id?: string }): Promise<Viewer> {
    // check if the given id is valid
    const viewerId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#viewers[viewerId]) this.#logger.error('Viewer with this id already exists.');

    // start the performance eval
    this.#performanceEvaluator.start('viewer_creation_' + viewerId);

    // create the actual viewer
    const viewer = new Viewer(viewerId, properties.type || RENDERERTYPE.STANDARD, properties.canvas);
    this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewer });

    // save the viewer
    this.#viewers[viewerId] = viewer;
    container.registerInstance('viewer', viewer);

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
   * Update all viewers.
   * The viewers are updated with all current changes in the scene tree.
   */
  public update(): void {
    if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
  }

  // #endregion Public Methods (7)
}