import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, Export, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, Parameter, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, Session, Viewer, VISIBILITYMODE } from '@shapediver/viewer'

let viewer: Viewer, session: Session;

(async () => {
    viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
})();

(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).ORTHOGRAPHIC_CAMERA_DIRECTION = ORTHOGRAPHIC_CAMERA_DIRECTION;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).VISIBILITYMODE = VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
(<any>window).EVENTTYPE = EVENTTYPE;
(<any>window).EXPORTTYPE = EXPORTTYPE;
(<any>window).PARAMETERTYPE = PARAMETERTYPE;
(<any>window).PARAMETERVISUALIZATION = PARAMETERVISUALIZATION;
(<any>window).ENVIRONMENTMAP = ENVIRONMENTMAP;

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
    session.getParameterById(id)!.value = value;
    await session.customize();
}

(<any>window).changeParameters = async ( parameterDictionary: { [key: string]: any } ): Promise<void> => {
    for(let param in parameterDictionary)
        session.getParameterById(param)!.value = parameterDictionary[param];
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