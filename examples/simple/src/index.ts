import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: "5569cbf86c65c97af07c7ab882f66518f3a16e7692779ae00e56600e49e8bcbda95ccb1b1835061c31a9cbdd413283db6b53929edcfc5038fe15f47d93b750c9dcedd7bc778fa75abdb1b2612957e35be480fa59e04331013bd41db0528131e4040f1cdc124954-ee592d7c8eab02f5f4061596086c06da", modelViewUrl: "https://nsc005.us-east-1.shapediver.com"
    });
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
})();
