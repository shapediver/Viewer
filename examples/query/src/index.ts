import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
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
        ticket: ticketIn || 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e',
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