import 'reflect-metadata'

import { container } from 'tsyringe'
import {
  api,
  CAMERATYPE,
  EVENTTYPE,
  Export,
  LIGHTTYPE,
  LOGGINGLEVEL,
  Output,
  Parameter,
  PerspectiveCamera,
  RENDERERTYPE,
  Session,
  TreeNode,
  Viewer,
  VISIBILITYMODE,
} from '@shapediver/viewer'
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine'
import { vec3 } from 'gl-matrix'

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
let currentNode: TreeNode;

(async () => {
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', logo: 'https://viewer.shapediver.com/v3/latest/api/images/gltf_monster.png' });
    const l = viewer.createLightScene({ name: 'gltf' });
    viewer.updateGridVisibility(false);
    viewer.updateGroundPlaneVisibility(false);
    viewer.assignLightScene(l.id);
    viewer.addAmbientLight({ color: 0xffffff, intensity: 0.3 })
    viewer.addDirectionalLight({ color: 0xffffff, intensity: 0.8 * Math.PI, direction: vec3.normalize(vec3.create(), vec3.fromValues(0.5, -0.866, 0)) })
    viewer.updateClearColor('#000000')
    viewer.updateEnvironmentMap('https://gltf-viewer.donmccurdy.com/assets/environment/venice_sunset_1k.hdr');
    viewer.updateRenderingSettings({
        physicallyCorrectLights: true,
        textureEncoding: 3001,
        outputEncoding: 3001,
        envMapIntensity: 1,
        envMapIntensityGroundPlane: 1,
        groundPlaneColor: '#d3d3d3',
        toneMapping: 0,
        toneMappingExposure: 1,
    });
})();


(<any>window).addGLTF = async (uri: string) => {
    let viewer = api.getViewer('myViewer')!;

    const node = await dataEngine.loadContent({
        format: 'gltf',
        href: uri
    })
    if (currentNode) api.sceneTree.removeNode(currentNode);
    currentNode = node;
    api.sceneTree.addNode(currentNode);
    api.update();
    await viewer.getCamera()!.zoomTo([], { duration: 0 });
    api.update();
    await new Promise(resolve => setTimeout(resolve, 10))
    if (viewer.getCamera()?.position[0].toPrecision(4) === viewer.getCamera()?.target[0].toPrecision(4) &&
        viewer.getCamera()?.position[1].toPrecision(4) === viewer.getCamera()?.target[1].toPrecision(4) &&
        viewer.getCamera()?.position[2].toPrecision(4) === viewer.getCamera()?.target[2].toPrecision(4)) {
            await viewer.getCamera()!.set([0, -0.5, 0], [0, 0, 0], { duration: 0 });
        }
    viewer.updateShow(true);
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