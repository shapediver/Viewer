import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
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


(async () => {
    let viewer1 = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewer1' })
    let viewer2 = await api.createViewer({ type: RENDERERTYPE.ATTRIBUTES, canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer2' })
    let session1 = await api.createSession({ ticket: '323d14cb9d0d6813f12f6cceef6bf0e996fd928c018b84f5909c199ef0812b728f42f38b83c81b73376a27af6ba9e1406bb78b4bd500723538466aa9a08f8cd0296ca3c996613116ea8f555e81151341a61668b3476a1a25d7c3d2623046f2ebfb17a50b25cea7-7e63e99c4fae11d60782d32ad555b925', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', id: 'mySession1' });

    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
})();