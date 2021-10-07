import 'reflect-metadata'

import {
  api,
  CAMERATYPE,
  ENVIRONMENTMAP,
  EVENTTYPE,
  Export,
  EXPORTTYPE,
  IExport,
  IParameter,
  ISession,
  IViewer,
  LIGHTTYPE,
  LOGGINGLEVEL,
  ORTHOGRAPHIC_CAMERA_DIRECTION,
  Parameter,
  PARAMETERTYPE,
  PARAMETERVISUALIZATION,
  RENDERERTYPE,
  Session,
  VISIBILITYMODE,
} from '@shapediver/viewer'

let viewer: IViewer, session: ISession;

(async () => {
    viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
})();
import * as SDV from '@shapediver/viewer'

(<any>window).sdv = SDV;

(<any>window).init = async (properties: { 
    ticket: string, 
    modelViewUrl: string, 
    bearerToken?: string, 
    primarySession?: boolean, 
    returnDTOs?: boolean, 
    id?: string 
}): Promise<void> => {
    session = await api.createSession(properties);
    api.update()
}

(<any>window).getParameters = (): { [key: string]: IParameter<any> } => {
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

(<any>window).getExports = (): { [key: string]: IExport } => {
    return session.exports;
}

(<any>window).requestExport = (id: string): Promise<any> => {
    const exp = session.getExportById(id);
    if(!exp) return new Promise(() => null);
    return exp.request();
}