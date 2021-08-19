import 'reflect-metadata'

import { container } from 'tsyringe'
import {
  api,
  CAMERATYPE,
  ENVIRONMENTMAP,
  EVENTTYPE,
  Export,
  EXPORTTYPE,
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
  Viewer,
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
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', logo: 'https://viewer.shapediver.com/v3/latest/api/images/gltf_monster.png' });
    viewer.createLightScene()
    viewer.addAmbientLight({color: '#ffffff', intensity: 0.5, name: 'ambient0'});
    viewer.addDirectionalLight({color: '#ffffff', intensity: 0.75, direction: vec3.fromValues(.5774, -.5774, .5774), castShadow: true, name: 'directional0'});
    viewer.addDirectionalLight({color: '#ffffff', intensity: 0.35, direction: vec3.fromValues(.25, -1, 1), castShadow: false, name: 'directional1'});
    viewer.updateEnvironmentMap('none')
    viewer.updateRenderingSettings({
        physicallyCorrectLights: false, // should be set to true (out old default was false, but this should definitely change) (old default: false)
        envMapIntensity: 1, // change the intensity of the environment Map (old default: 1)
        envMapIntensityGroundPlane: 1, // change the intensity of the environment Map for the groundPlane (old default: 1)
        groundPlaneColor: '#D3D3D3', // change the color of the ground plane (old default: '#D3D3D3')
        toneMapping: 0, // Use a different tone mapping (0: none, 1: linear, 2: reinhard, 3: cineon, 4: ACESFilmic) (old default: 0)
        toneMappingExposure: 1, // change the exposure of the tone mapping (old default: 1)
        textureEncoding: 3000, // change the encoding of the textures in the scene (3000: linear, 3001: sRGB) (old default: 3000)
        outputEncoding: 3000, // change the encoding of the textures in the scene (3000: linear, 3001: sRGB) (old default: 3000)
    })
})();


(<any>window).addGLTF = async (uri: string) => {
    let viewer = api.getViewer('myViewer')!;

    const node = await dataEngine.loadContent({
        format: (<any>window).gltfVersion === '1.0' ? 'glb': 'gltf',
        href: uri
    })
    if (currentNode) api.sceneTree.removeNode(currentNode);
    currentNode = node;
    api.sceneTree.addNode(currentNode);
    api.update()
    await viewer.getCamera()!.zoomTo([], { duration: 0 });
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