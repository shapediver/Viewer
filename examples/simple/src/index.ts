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
    viewer.environmentMap = 'neutral';
    viewer.ambientOcclusion = false;
    viewer.shadows = false;
    viewer.groundPlaneVisibility = false;
    viewer.gridVisibility = false;



    const node = await dataEngine.loadContent({
        format: 'gltf',
        href: './project_polly.glb'
    })

    api.sceneTree.root.addChild(node);
    api.update()
    await viewer.camera!.zoomTo(undefined, { duration: 0 });
    viewer.show = true;

})();