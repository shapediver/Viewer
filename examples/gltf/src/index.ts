

import {
  api,
  ENVIRONMENT_MAP,
  TreeNode,
} from '@shapediver/viewer'
import { container } from 'tsyringe'
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine'

import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;
(<any>window).gltfVersion = '2.0'

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
let currentNode: TreeNode;

let promise: Promise<void>;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', branding: { logo: 'https://viewer.shapediver.com/v3/latest/api/images/gltf_monster.png', backgroundColor: 'rgb(3, 5, 49)' } });
    viewer.ambientOcclusion = false;
    viewer.shadows = false;
    viewer.physicallyCorrectLights = true;
    viewer.groundPlaneVisibility = false;
    viewer.gridVisibility = false;
    viewer.environmentMap = ENVIRONMENT_MAP.NEUTRAL;
    promise = new Promise<void>(resolve => {
        api.addListener(SDV.EVENTTYPE.TASK.TASK_END, (e) => {
            const taskEvent = e as SDV.ITaskEvent;
            if(taskEvent.type === SDV.TASKTYPE.ENVIRONMENT_MAP_LOADING)
            resolve();
        });
    })
    await promise;
})();


(<any>window).addGLTF = async (uri: string) => {
    await promise;
    let viewer = api.viewers['myViewer'];

    const node = await dataEngine.loadContent({
        format: (<any>window).gltfVersion === '1.0' ? 'glb': 'gltf',
        href: uri
    })
    if (currentNode) api.sceneTree.removeNode(currentNode);
    currentNode = node;
    api.sceneTree.addNode(currentNode);
    api.update()
    await viewer.camera!.set([0,0,0], [0,0,0], { duration: 0 });
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