

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import { mat4 } from 'gl-matrix';

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({ 
        ticket: 'd2795be17bb5f36ad8e799cd58c35b4fb84e84cb7ef5b8aa1365b7fe76fcaf3234167f0924fa613f03f31f82057b3107631c003bcc9077f785d38ad9a354a489e652d2be97a8e1f69c975bba070727b28f24af7ff68a9c966a124121362de07f6aecbdb9ebc46a-c13747650a644e02d24c0579cc104655', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
    });
})();