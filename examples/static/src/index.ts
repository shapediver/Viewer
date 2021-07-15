import 'reflect-metadata'

import { api, Export, Parameter, Session, Viewer } from '@shapediver/viewer'

let viewer: Viewer, session: Session;

(async () => {
    viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
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
    return session.parameters;
}

(<any>window).changeParameter = async (id: string, value: any): Promise<void> => {
    session.getParameterById(id)!.updateValue(value);
    await session.customize();
}

(<any>window).changeParameters = async ( parameterDictionary: { [key: string]: any } ): Promise<void> => {
    for(let param in parameterDictionary)
        session.getParameterById(param)!.updateValue(parameterDictionary[param]);
    await session.customize();
}

(<any>window).getExports = (): { [key: string]: Export } => {
    return session.exports;
}

(<any>window).requestExport = (id: string): Promise<any> => {
    const exp = session.getExportById(id);
    if(!exp) return new Promise(() => null);
    return exp.request();
}