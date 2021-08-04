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


const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
const ticket = '75f6f416a8200ed5d64f9c15f39320df0c9a630878d235332451657e1a1524fa7a39ef96d4a0b866c6ebacbf202b32e5fad90f4fe6a54276d892831f5aa4bc2cbd4cdd73231a2db23055c7a9d6d2707eb329315ab0f8d5a489cdff33b99e9b49ed68af70f4b139c941000063d19fff574b7c3b2b55460eac6ec23a86f3fd0d-a2beded2e997ea7d1d6e9b03cd3c86d1';

(async () => {
    let viewer1 = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewer1' })
    let viewer2 = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer2' })
    let session1 = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession1', excludeViewers: ['myViewer2', 'myViewer3', 'myViewer4'] });
    let session2 = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession2', excludeViewers: ['myViewer1', 'myViewer3', 'myViewer4']});

    (<any>viewer1.getCamera()!).controls.updateEnableAutoRotation(true);
    (<any>viewer1.getCamera()!).controls.updateAutoRotationSpeed(1);
    (<any>viewer2.getCamera()!).controls.updateEnableAutoRotation(true);
    (<any>viewer2.getCamera()!).controls.updateAutoRotationSpeed(1);

    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
})();