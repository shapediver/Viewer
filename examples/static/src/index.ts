import "reflect-metadata"
import { api, Session, Viewer, Parameter, Export } from "@shapediver/viewer";

let viewer: Viewer, session: Session;

(async () => {
    viewer = api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
})();

(<any>window).sceneTree = api.sceneTree;
(<any>window).api = api;

(<any>window).init = async (properties: { 
    ticket: string, 
    modelViewUrl: string, 
    bearerToken?: string, 
    primarySession?: boolean, 
    returnDTOs?: boolean, 
    id?: string 
}): Promise<void> => {
    session = await api.createAndInitializeSession(properties);
    api.update()
}

(<any>window).getParameters = (): { [key: string]: Parameter<any> } => {
    return session.getParameters();
}

(<any>window).changeParameter = async (id: string, value: any): Promise<void> => {
    session.updateParameter(id, value);
    await session.customize();
}

(<any>window).changeParameters = async ( parameterDictionary: { [key: string]: any } ): Promise<void> => {
    for(let param in parameterDictionary)
        session.updateParameter(param, parameterDictionary[param]);
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