import { Tree } from "@shapediver/viewer.shared.node-tree";
import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { container, singleton } from "tsyringe";
import { Session } from "./session/Session";
import { RENDERERTYPE, Viewer } from "./viewer/Viewer";
import { StateEngine, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { UuidGenerator } from "@shapediver/viewer.shared.utils";

@singleton()
export class Api {
  // #region Properties (9)

  private readonly _sceneTree = <Tree>container.resolve(Tree);
  private readonly _sessions: { [key: string]: Session } = {};
  private readonly _stateEngine = <StateEngine>container.resolve(StateEngine);
  private readonly _eventEngine = <EventEngine>container.resolve(EventEngine);
  private readonly _uuidGenerator: UuidGenerator = container.resolve(UuidGenerator);
  private readonly _viewers: { [key: string]: Viewer } = {};

  private _commitSettings: boolean = false;
  private _loggingLevel: number = -1;
  private _showMessages: boolean = true;

  // #endregion Properties (9)

  constructor() {
    this._eventEngine.addListener(EVENTTYPE.UPDATE.UPDATE_READY, () => { this.onUpdate(); })
  }

  // #region Public Accessors (7)

  /**
   * Getter commitSettings
   * @return {boolean}
   */
  public get commitSettings(): boolean {
    return this._commitSettings;
  }

  /**
   * Setter commitSettings
   * @param {boolean} value
   */
  public set commitSettings(value: boolean) {
    this._commitSettings = value;
  }

  /**
   * Getter loggingLevel
   * @return {number}
   */
  public get loggingLevel(): number {
    return this._loggingLevel;
  }

  /**
   * Setter loggingLevel
   * @param {number} value
   */
  public set loggingLevel(value: number) {
    this._loggingLevel = value;
  }

  public get sceneTree(): Tree {
    return this._sceneTree;
  }

  /**
   * Getter showMessages
   * @return {boolean}
   */
  public get showMessages(): boolean {
    return this._showMessages;
  }

  /**
   * Setter showMessages
   * @param {boolean} value
   */
  public set showMessages(value: boolean) {
    this._showMessages = value;
  }

  // #endregion Public Accessors (7)

  // #region Public Methods (7)

  public async createSession(ticket: string, modelViewUrl: string, id?: string): Promise<Session> {
    const sessionId = id || this._uuidGenerator.create();
    if(this._sessions[sessionId]) new Error('Session with this id already exists.');
    const session = new Session(
      sessionId,
      this._sceneTree,
      async () => {
        Object.values(this._viewers).forEach((e) => e.update());
      },
      ticket,
      modelViewUrl
    );
    await session.init()
    this._sessions[sessionId] = session;
    return this._sessions[sessionId];
  }

  public async createViewer(type: RENDERERTYPE, canvas: HTMLCanvasElement, id?: string): Promise<Viewer> {
    const viewerId = id || this._uuidGenerator.create();
    if(this._viewers[viewerId]) new Error('Viewer with this id already exists.');
    const viewer = new Viewer(viewerId, type, canvas);
    this._viewers[viewerId] = viewer;
    Object.values(this._viewers).forEach((e) => e.update());
    return this._viewers[viewerId];
  }

  public getSession(id: string): Session {
    return this._sessions[id];
  }

  public getSessions(): { [key: string]: Session } {
    const r: { [key: string]: Session } = {};
    for (let s in this._sessions)
      r[s] = this._sessions[s];
    return r;
  }

  public getViewer(id: string): Viewer {
    return this._viewers[id];
  }

  public getViewers(): { [key: string]: Viewer } {
    const r: { [key: string]: Viewer } = {};
    for (let v in this._viewers)
      r[v] = this._viewers[v];
    return r;
  }

  public onUpdate(): void {
    Object.values(this._viewers).forEach((e) => e.update());
  }

  // #endregion Public Methods (7)
}