import "reflect-metadata"
import { api, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, LOGGINGLEVEL, EVENTTYPE } from "@shapediver/viewer"

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).VISIBILITYMODE = VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
(<any>window).EVENTTYPE = EVENTTYPE;


const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
const ticket = 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8';

(async () => {
    let viewer1 = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewer1' })
    let viewer2 = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer2' })
    let viewer3 = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas3'), id: 'myViewer3' })
    let viewer4 = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas4'), id: 'myViewer4' })
    let session1 = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession1', excludeViewers: ['myViewer2', 'myViewer3', 'myViewer4'] });
    let session2 = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession2', excludeViewers: ['myViewer1', 'myViewer3', 'myViewer4']});
    let session3 = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession3', excludeViewers: ['myViewer1', 'myViewer2', 'myViewer4']});
    let session4 = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession4', excludeViewers: ['myViewer1', 'myViewer2', 'myViewer3']});
    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
})();