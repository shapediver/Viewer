import * as SDV from '@shapediver/viewer'
import {
  api,
  CAMERATYPE,
  DataEngine,
  ENVIRONMENT_MAP,
  EVENTTYPE,
  EXPORTTYPE,
  LIGHTTYPE,
  LOGGINGLEVEL,
  ORTHOGRAPHIC_CAMERA_DIRECTION,
  PARAMETERTYPE,
  PARAMETERVISUALIZATION,
  RENDERERTYPE,
  VISIBILITYMODE,
} from '@shapediver/viewer'
import { container } from 'tsyringe'

(<any>window).SDV = SDV;
const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    viewer.environmentMap = ENVIRONMENT_MAP.VENICE_SUNSET;
    viewer.ambientOcclusion = false;
    viewer.shadows = false;
    viewer.groundPlaneVisibility = false;
    viewer.gridVisibility = false;
    viewer.physicallyCorrectLights = true;
    viewer.textureEncoding = SDV.TEXTURE_ENCODING.SRGB;
    viewer.outputEncoding = SDV.TEXTURE_ENCODING.SRGB;


    //href: 'https://cx20.github.io/gltf-test/tutorialModels/MosquitoInAmber/glTF/MosquitoInAmber.gltf'

    const node = await dataEngine.loadContent({
        format: 'gltf',
        href: 'https://shapediverviewer.s3.amazonaws.com/v3/examples/gltf/2.0/TransmissionRoughnessTest/glTF/TransmissionRoughnessTest.gltf'
    })

    api.sceneTree.root.addChild(node);
    api.update()
    await viewer.camera!.zoomTo(undefined, { duration: 0 });
    viewer.show = true;

})();