import { Tree } from "@shapediver/viewer.shared.node-tree";
import { container, singleton } from "tsyringe";
import { Session } from "./session/Session";
import { Viewer } from "./viewer/Viewer";
import { StateEngine, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { RENDERERTYPE } from "@shapediver/viewer.rendering-engine.rendering-engine";

@singleton()
export class Api {
  
  // TODO
  #commitSettings: boolean = false;
  #loggingLevel: number = -1;
  #showMessages: boolean = true;

  readonly #sessions: { [key: string]: Session } = {};
  readonly #viewers: { [key: string]: Viewer } = {};
  // #region Constructors (1)

  /**
   * @ignore
   */
  constructor() {
    const stateEngine = <StateEngine>container.resolve(StateEngine);
    (<EventEngine>container.resolve(EventEngine)).addListener(EVENTTYPE.UPDATE.UPDATE_READY, () => { this.update(); })
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
   * The session will be initialized automatically, 
   * and the first computation will be loaded in the the scene tree once the promise has resolved.
   * 
   * @param ticket the ticket of a session
   * @param modelViewUrl the modelViewUrl of the session
   * @param id the unique id the session should have
   * @returns 
   */
  public async createSession(ticket: string, modelViewUrl: string, id?: string): Promise<Session> {
    const sessionId = id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#sessions[sessionId]) new Error('Session with this id already exists.');
    const session = new Session(sessionId, ticket, modelViewUrl);
    await session.init()
    this.#sessions[sessionId] = session;
    container.registerInstance('session', session);
    return this.#sessions[sessionId];
  }

  /**
   * Create a viewer with the provided type and canvas.
   * An id can be provided. This id can be used to retrieve this object later on.
   * In the case no id has been provided, a unique one will be generated.
   * 
   * The viewer will automatically load what is currently in the scene tree.
   * 
   * @param type the type of the viewer
   * @param canvas the canvas that the viewer should use
   * @param id the unique id the session should have 
   * @returns 
   */
  public async createViewer(type: RENDERERTYPE, canvas: HTMLCanvasElement, id?: string): Promise<Viewer> {
    const viewerId = id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (this.#viewers[viewerId]) new Error('Viewer with this id already exists.');
    const viewer = new Viewer(viewerId, type, canvas);
    this.#viewers[viewerId] = viewer;
    container.registerInstance('viewer', viewer);
    this.update();
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