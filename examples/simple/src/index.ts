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
    viewer.environmentMap = ENVIRONMENT_MAP.NEUTRAL;
    viewer.ambientOcclusion = false;
    viewer.shadows = false;
    viewer.groundPlaneVisibility = false;
    viewer.gridVisibility = false;
    viewer.physicallyCorrectLights = true;
    viewer.textureEncoding = SDV.TEXTURE_ENCODING.SRGB;
    viewer.outputEncoding = SDV.TEXTURE_ENCODING.SRGB;


    // href: 'https://cx20.github.io/gltf-test/tutorialModels/MosquitoInAmber/glTF/MosquitoInAmber.gltf'
    // href: 'http://localhost:8080/bee_animation_rigged/scene.gltf'

    const node = await dataEngine.loadContent({
        format: 'gltf',
        href: 'http://localhost:8080/bee (1)/source/Bee.glb'
    })

    api.sceneTree.root.addChild(node);
    api.update()
    await viewer.camera!.zoomTo(undefined, { duration: 0 });
    viewer.show = true;

})();