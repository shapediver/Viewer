import { Tree } from "@shapediver/viewer.shared.node-tree";
import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { container, singleton } from "tsyringe";
import { Session } from "./session/Session";
import { RENDERERTYPE, Viewer } from "./viewer/Viewer";
import { StateEngine, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { UuidGenerator } from '@shapediver/viewer.shared.utils';

let _commitSettings: boolean = false;
let _loggingLevel: number = -1;
let _showMessages: boolean = true;

const _sessions: { [key: string]: Session } = {};
const _viewers: { [key: string]: Viewer } = {};
@singleton()
export class Api {
  // #region Constructors (1)

  constructor() {
    const stateEngine = <StateEngine>container.resolve(StateEngine);
    (<EventEngine>container.resolve(EventEngine)).addListener(EVENTTYPE.UPDATE.UPDATE_READY, () => { this.onUpdate(); })
  }

  // #endregion Constructors (1)

  // #region Public Accessors (7)

  /**
   * Getter commitSettings
   * @return {boolean}
   */
  public get commitSettings(): boolean {
    return _commitSettings;
  }

  /**
   * Setter commitSettings
   * @param {boolean} value
   */
  public set commitSettings(value: boolean) {
    _commitSettings = value;
  }

  /**
   * Getter loggingLevel
   * @return {number}
   */
  public get loggingLevel(): number {
    return _loggingLevel;
  }

  /**
   * Setter loggingLevel
   * @param {number} value
   */
  public set loggingLevel(value: number) {
    _loggingLevel = value;
  }

  public get sceneTree(): Tree {
    return <Tree>container.resolve(Tree);
  }

  /**
   * Getter showMessages
   * @return {boolean}
   */
  public get showMessages(): boolean {
    return _showMessages;
  }

  /**
   * Setter showMessages
   * @param {boolean} value
   */
  public set showMessages(value: boolean) {
    _showMessages = value;
  }

  // #endregion Public Accessors (7)

  // #region Public Methods (7)

  public async createSession(ticket: string, modelViewUrl: string, id?: string): Promise<Session> {
    const sessionId = id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (_sessions[sessionId]) new Error('Session with this id already exists.');
    const session = new Session(
      sessionId,
      <Tree>container.resolve(Tree),
      async () => {
        Object.values(_viewers).forEach((e) => e.update());
      },
      ticket,
      modelViewUrl
    );
    await session.init()
    _sessions[sessionId] = session;
    return _sessions[sessionId];
  }

  public async createViewer(type: RENDERERTYPE, canvas: HTMLCanvasElement, id?: string): Promise<Viewer> {
    const viewerId = id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
    if (_viewers[viewerId]) new Error('Viewer with this id already exists.');
    const viewer = new Viewer(viewerId, type, canvas);
    _viewers[viewerId] = viewer;
    Object.values(_viewers).forEach((e) => e.update());
    return _viewers[viewerId];
  }

  public getSession(id: string): Session {
    return _sessions[id];
  }

  public getSessions(): { [key: string]: Session } {
    const r: { [key: string]: Session } = {};
    for (let s in _sessions)
      r[s] = _sessions[s];
    return r;
  }

  public getViewer(id: string): Viewer {
    return _viewers[id];
  }

  public getViewers(): { [key: string]: Viewer } {
    const r: { [key: string]: Viewer } = {};
    for (let v in _viewers)
      r[v] = _viewers[v];
    return r;
  }

  public onUpdate(): void {
    Object.values(_viewers).forEach((e) => e.update());
  }

  // #endregion Public Methods (7)
}