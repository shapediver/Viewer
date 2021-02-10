import { Tree } from "@shapediver/viewer.node-tree.tree";
import { IRenderingEngine as RenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { container, singleton } from "tsyringe";
import { Session } from "./session/implementation/Session";
import { IExport } from "./session/interfaces/IExport";
import { IParameter } from "./session/interfaces/IParameter";
import { ISession } from "./session/interfaces/ISession";
import { Viewer } from "./viewer/implementation/Viewer";
import { IViewer, RENDERERTYPE } from "./viewer/interfaces/IViewer";

@singleton()
class Api {
    // #region Properties (4)

    private _renderingEngines: RenderingEngine[] = [];
    private _sceneTree = container.resolve(Tree);
    private _sessions: { [key: string]: ISession } = {};
    private _viewers: { [key: string]: IViewer } = {};

    // #endregion Properties (4)

    // #region Public Accessors (1)

    public get sceneTree(): Tree {
        return this._sceneTree;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (5)

    public async createSession(ticket: string, modelViewUrl: string, name: string): Promise<ISession> {
        if(this._sessions[name]) 
            throw new Error('Session with name ' + name + ' already exists.');
        const session =  new Session(
            this._sceneTree, 
            () => {
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

export const api = <Api>container.resolve(Api);

export {
    ISession as Session, 
    IParameter as Parameter, 
    IExport as Export
}

export {
    IViewer as Viewer
}

export {
    RENDERERTYPE
}