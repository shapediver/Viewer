import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;

const getParameterByName = (name: string, url = window.location.href) => {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const ticketIn = getParameterByName('ticket');
const modelViewUrlIn = getParameterByName('modelViewUrl');
const parametersIn = getParameterByName('parameters');

(async () => {
    const { ticket, modelViewUrl } = { 
        ticket: ticketIn || '5dbb5117b630fb83a8056f06ee719f570a904be69ac45152822c327f33d21483a8dae9e3122ae17c992ea6b3e2b65af09ac9871dd83a263ef488e58b2c2260a07899418548bd4a8dcf1cff3ca33954c9e4c0fe60118f730d03c56b7e598eab908b34e16ba8625d-b5ac96869614191d8ada6725aba8fba6',
        modelViewUrl: modelViewUrlIn || 'https://sdeuc1.eu-central-1.shapediver.com'
    };
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({ ticket, modelViewUrl, id: 'mySession'});
    if(parametersIn){
        const parameterObj = JSON.parse(parametersIn);
        for(let key in parameterObj) {
            if(session.parameters[key])
                session.parameters[key].value = parameterObj[key];
        }    
        await session.customize();
    }
})();