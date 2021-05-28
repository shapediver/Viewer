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
const ticket1 = 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8';
const ticket2 = 'c779ad9d41eb135de16cd86e6c84ca821f2fdc60c76f7a1041cc2ec8a93895a646a1d4995e59360559f3a7308b6bd6c1a3287fe3dfe1f205637f078c08dfc49ad03b63074a21a1f3f2bd0b11e019df687920c51d948b8ab9908eb7c3ea95cd00147d79cdc8c44dc950769c7da5cbcd528ae9ceb132d7-6f70a69df8698f79a7e01fcdd6d012f7';
const ticket3 = 'a7a468be421d49eeede903037db71fadbcc9df95919b088e497ef32c4e3d4934a9c0f866997c915f40f4bbb432119fc838c44d89061a64185f6ca8b02125c0d36aa3b1c43951fe0800ec5d367ec2618351a3dbfbac642b23b3593693c8fce19a89122037938d2eb614fcdc2bc50c0dffd01ef2b9718c-69dd449456f08051ab79a42a4cbc9881';
const ticket4 = 'a7a468be421d49eeede903037db71fadbcc9df95919b088e497ef32c4e3d4934a9c0f866997c915f40f4bbb432119fc838c44d89061a64185f6ca8b02125c0d36aa3b1c43951fe0800ec5d367ec2618351a3dbfbac642b23b3593693c8fce19a89122037938d2eb614fcdc2bc50c0dffd01ef2b9718c-69dd449456f08051ab79a42a4cbc9881';

(async () => {
    let viewer1 = api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewer1' })
    let viewer2 = api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer2' })
    let viewer3 = api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas3'), id: 'myViewer3' })
    let viewer4 = api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas4'), id: 'myViewer4' })
    let session1 = await api.createAndInitializeSession({ ticket: ticket1, modelViewUrl, id: 'mySession1', excludeViewers: ['myViewer2', 'myViewer3', 'myViewer4'] });
    let session2 = await api.createAndInitializeSession({ ticket: ticket2, modelViewUrl, id: 'mySession2', excludeViewers: ['myViewer1', 'myViewer3', 'myViewer4']});
    let session3 = await api.createAndInitializeSession({ ticket: ticket3, modelViewUrl, id: 'mySession3', excludeViewers: ['myViewer1', 'myViewer2', 'myViewer4']});
    let session4 = await api.createAndInitializeSession({ ticket: ticket4, modelViewUrl, id: 'mySession4', excludeViewers: ['myViewer1', 'myViewer2', 'myViewer3']});
    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
})();