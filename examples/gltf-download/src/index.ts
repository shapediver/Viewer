

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({ 
        ticket: '98d1c45ef2cc48a165d8acfc13c682ec45eff93a06ccf76dc08bf63ecb6110d3720029e91a709e36376e7800b52bb33140f513891a184dbb75d140067aa1db38df3088a6e3f96a9bbac314f7a63fe5b226a58e3b895b070c757647696562c54f69ca64c1516e60-c351761efc140e342ed819b4d0707a22', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession'
    });

    const blob = await api.convertSceneToGLTF(true);
    const file = new Blob([blob], {type: 'model/gltf-binary'});
    const fileURL = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = fileURL;
    a.download = 'glTFDownload.gltf';
    a.click();
    URL.revokeObjectURL(fileURL);
})();