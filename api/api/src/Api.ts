import { Tree } from "@shapediver/viewer.shared.node-tree";
import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { container, singleton } from "tsyringe";
import { Session } from "./session/implementation/Session";
import { ISession } from "./session/interfaces/ISession";
import { Viewer } from "./viewer/implementation/Viewer";
import { IViewer, RENDERERTYPE } from "./viewer/interfaces/IViewer";
import { StateEngine } from '@shapediver/viewer.shared.services';

@singleton()
export class Api {
    // #region Properties (8)

    private readonly _renderingEngines: RenderingEngine[] = [];
    private readonly _sceneTree = <Tree>container.resolve(Tree);
    private readonly _sessions: { [key: string]: ISession } = {};
    private readonly _stateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _viewers: { [key: string]: IViewer } = {};

    private _commitSettings: boolean = false;
    private _loggingLevel: number = -1;
    private _showMessages: boolean= true;

    // #endregion Properties (8)

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

    // #region Public Methods (5)

    public async createSession(ticket: string, modelViewUrl: string, name: string): Promise<ISession> {
        if(this._sessions[name]) 
            throw new Error('Session with name ' + name + ' already exists.');
        const session =  new Session(
            this._sceneTree, 
            async () => {
                this._renderingEngines.forEach((e) => e.updateSceneTree());
            }, 
            ticket, 
            modelViewUrl
        );
        await session.init()
        this._sessions[name] = session;
        return this._sessions[name];
    }

    public async createViewer(type: RENDERERTYPE, canvas: HTMLCanvasElement, name: string): Promise<IViewer> {
        if( this._viewers[name]) 
            throw new Error('Viewer with name ' + name + ' already exists.');
        const viewer = new Viewer(type, name, canvas);
        this._renderingEngines.push(viewer.renderingEngine)
        this._renderingEngines.forEach((e) => e.updateSceneTree());
        this._viewers[name] = viewer;
        return  this._viewers[name];
    }

    public getSession(name: string): ISession {
        return this._sessions[name];
    }

    public getViewer(name: string): IViewer {
        return this._viewers[name];
    }

    public onUpdate(): void {
        this._renderingEngines.forEach((e) => e.updateSceneTree());
    }

    // #endregion Public Methods (5)
}