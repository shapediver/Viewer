import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, EVENTTYPE, LOGGINGLEVEL, PerspectiveCamera } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"
import { vec3 } from "gl-matrix";

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);

(async () => {
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', logo: 'https://viewer.shapediver.com/v3/latest/api/images/gltf_monster.png' });
    const l = viewer.createLightScene({name: 'gltf'});
    viewer.updateGridVisibility(false);
    viewer.updateGroundPlaneVisibility(false);
    viewer.assignLightScene(l.id);
    viewer.addAmbientLight({color: 0xffffff, intensity: 0.2})
    viewer.addDirectionalLight({color: 0xffffff, intensity: 1, direction: vec3.normalize(vec3.create(), vec3.fromValues(0.5, -0.866, 0))})
    viewer.updateClearColor('#000000')
    viewer.updateEnvironmentMap('default');
})();


(<any>window).addGLTF = async (uri: string) => {
    let viewer = api.getViewer('myViewer')!;
    const node = await dataEngine.loadContent({
        format: 'gltf',
        href: uri
    })
    api.sceneTree.addNode(node);
    viewer.updateShow(true);
    api.update();
    await viewer.getCamera()!.set([0, -0.5, 0], [0, 0, 0], {duration: 0});
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