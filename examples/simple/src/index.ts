
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: '83ce6324af4fa15b6803a4f2a33fed6281e7d0b2576b8749215e24068f54b9295b0e64a74b6f7b992ad790ea52364305613b025cb1b4633972c28c8ee8986623198a10b7d3d7f7c6bba9eb3de40136e161fae5e65619faf557bbdb64bcf4b7c4fd73f20fbab9f4-a55d31f5dbd8c8f9ddbde17a84d766d3',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    })
})();