

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import { mat4 } from 'gl-matrix';

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({ 
        ticket: '43f1c44294bc1096c2cdcbcceb22758d9439c37a0e855aec3853ad2cc65776f2ef3cfedf31b02e9923677800be38035844047fc0378c760d6c6a5d70ff8ea9ca2468f98ecc1adacf12d7503b12464179f95dfe5befb216dd79258a511981074e5e125276393d4b-18818b8f33d8b9e1eb1f04909786f9b9', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
    });
})();