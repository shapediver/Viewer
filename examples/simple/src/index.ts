

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import { mat4 } from 'gl-matrix';

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    

    let session2 = await api.createSession({ 
        ticket: 'edf3d0268064d468113472d066409f719a3703697ff87a70500153f983e10df4f69e18ae7ded5310355b106f1e441fe5502dae8d922175e3c49f7cbf99ccad55c3ae9bd2c7467931fa607ded1b0dbc1fbb0ef1dfe0674b89c6c0ea4b8f05d171b35dcd686ea7ac-fe089d65061189e39a025775b793848f', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession2',
    });
    // viewer.textureEncoding = SDV.TEXTURE_ENCODING.SRGB;
    // viewer.outputEncoding = SDV.TEXTURE_ENCODING.SRGB;
    // viewer.physicallyCorrectLights = true;
    viewer.environmentMap = 'none';
    viewer.environmentMapAsBackground = true;

    let session = await api.createSession({ 
        ticket: '5dbb5117b630fb83a8056f06ee719f570a904be69ac45152822c327f33d21483a8dae9e3122ae17c992ea6b3e2b65af09ac9871dd83a263ef488e58b2c2260a07899418548bd4a8dcf1cff3ca33954c9e4c0fe60118f730d03c56b7e598eab908b34e16ba8625d-b5ac96869614191d8ada6725aba8fba6', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
    });
    session.node.transformations.push({
        id: 'trans',
        matrix: mat4.fromTranslation(mat4.create(), [0,0,25])
    })
    session.node.updateVersion();
    api.update();
})();