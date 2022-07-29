
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: 'a38c5e8d7bec2cc88d6e2718476f4d7f80112033915dca45674c215037ba2be86144abb7e939eb386558282a9233d1df2e56cbdd8049fb437759d9a9ddf3cf4013e8a99e782be07d824c44e9f425bea39d977b718f57678ab80bdc91560018b9a144b0a5eb5a0d-783067a7ddb608e2bf5511c37bcedfd3',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    })
})();