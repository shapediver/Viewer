

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import { mat4 } from 'gl-matrix';

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({ 
        ticket: '888f496993cc102a4ac2b7fbb9d0bb6a1690106857776ea44c7077362d53d7823200e478d8d049af60c0eb1e241fcd0242f9c1e7d326f7b231832aedaca20d1baa20682d8d35d657bc404fcd34bfb0e69543b102616f4618812f5c7a149e9cfc11dcc0b2651657-70ad6758d90a9703b96383caeab9343f', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
    });
})();