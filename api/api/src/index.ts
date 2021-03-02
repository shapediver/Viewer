import { container } from "tsyringe";
import { Api } from "./Api";
import { IExport } from "./session/interfaces/IExport";
import { IParameter } from "./session/interfaces/IParameter";
import { ISession } from "./session/interfaces/ISession";
import { IViewer, RENDERERTYPE } from "./viewer/interfaces/IViewer";

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