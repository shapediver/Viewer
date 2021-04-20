import "reflect-metadata"
import { api, Session, Viewer, Parameter, Export } from "@shapediver/viewer";

let viewer: Viewer, session: Session;

(async () => {
    viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
})();

(<any>window).sceneTree = api.sceneTree;
(<any>window).api = api;

(<any>window).init = async (ticket: string, modelViewUrl: string): Promise<void> => {
    session = await api.createSession({ ticket, modelViewUrl, id: 'mySession'});
    api.update()
}

(<any>window).getParameters = (): { [key: string]: Parameter<any> } => {
    return session.getParameters();
}

(<any>window).changeParameter = async (id: string, value: string): Promise<void> => {
    session.getParameter(id)!.value = value;
    await session.customize();
}

(<any>window).getExports = (): { [key: string]: Export } => {
    return session.getExports();
}

(<any>window).requestExport = (id: string): Promise<any> => {
    const exp = session.getExport(id);
    if(!exp) return new Promise(() => null);
    return exp.request();
}