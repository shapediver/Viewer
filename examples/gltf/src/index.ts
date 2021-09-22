import 'reflect-metadata'

import { container } from 'tsyringe'
import {
  api,
  CAMERATYPE,
  ENVIRONMENTMAP,
  EVENTTYPE,
  Export,
  EXPORTTYPE,
  IStandardViewer,
  LIGHTTYPE,
  LOGGINGLEVEL,
  ORTHOGRAPHIC_CAMERA_DIRECTION,
  Output,
  Parameter,
  PARAMETERTYPE,
  PARAMETERVISUALIZATION,
  PerspectiveCamera,
  RENDERERTYPE,
  Session,
  TreeNode,
  VISIBILITYMODE,
} from '@shapediver/viewer'
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine'
import { vec3 } from 'gl-matrix'

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

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).gltfVersion = '2.0'

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
let currentNode: TreeNode;

(async () => {
    let viewer = <IStandardViewer>await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', logo: 'https://viewer.shapediver.com/v3/latest/api/images/gltf_monster.png' });
    viewer.ambientOcclusion = false;
    viewer.groundPlaneVisibility = false;
    viewer.environmentMap = ENVIRONMENTMAP.CANNON_EXTERIOR;
    viewer.gridVisibility = false;
    viewer.clearColor = 'rgb(3, 5, 49)'
})();


(<any>window).addGLTF = async (uri: string) => {
    let viewer = api.viewers['myViewer'];

    const node = await dataEngine.loadContent({
        format: (<any>window).gltfVersion === '1.0' ? 'glb': 'gltf',
        href: uri
    })
    if (currentNode) api.sceneTree.removeNode(currentNode);
    currentNode = node;
    api.sceneTree.addNode(currentNode);
    api.update()
    await viewer.camera!.zoomTo(undefined, { duration: 0 });
    viewer.show = true;
}
document.addEventListener("dragover", (event) => {
    event.preventDefault();
});

document.addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const files = event.dataTransfer!.files;
    let rootFile;
    Array.from(files).forEach((file) => {
        if (file.name.match(/\.(gltf|glb)$/))
            rootFile = file;
    });

    const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);
    (<any>window).addGLTF(fileURL);
});