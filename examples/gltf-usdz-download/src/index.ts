

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({
        ticket: 'bd2771c0df2eaf45b8e9d290a37f4470a644ca71406fd9d81f5e53abdf3a47f06619ec2369ac3c1a572f68716579083bb5ec2ffcd8ccd8579ae7bb805ebffeeb759522a10d9aebe17e7095ec44531e81a4d69f6813f929b497eb0759489f3094d1c68149cb6498-79280110eaf8c55d095ca4b40b6e300f',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
        id: 'mySession'
    });

    if (!session.canUploadGLTF)
        throw new Error('Session is not AR-ready.')

    const fileGLTF = await session.uploadGLTF(<any>'none', 'eventId1');
    const aGLTF = document.createElement("a");
    aGLTF.href = fileGLTF;
    aGLTF.download = (session.node.name || 'model') + '.gltf';
    aGLTF.click();

    const fileUSDZ = await session.uploadGLTF(<any>'usdz', 'eventId1');
    const aUSDZ = document.createElement("a");
    aUSDZ.href = fileUSDZ;
    aUSDZ.download = (session.node.name || 'model') + '.usdz';
    aUSDZ.click();
})();