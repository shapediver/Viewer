import "reflect-metadata"
import { api, RENDERERTYPE, CAMERATYPE, LIGHTTYPE } from "@shapediver/viewer"

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;

(async () => {
    await api.createViewer(RENDERERTYPE.STANDARD, <HTMLCanvasElement>document.getElementById('canvas'), 'myViewer')
})();