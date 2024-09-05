import * as SDV from '@shapediver/viewer';
(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: '9600def8d1b57c806e8471b16c31ae26ba5d9964b1d925f58439d50e589bf5bdcd1610ae1e389b9ded8ae85020376406dda2323d5b4ff101b4b97633a9bc78f7ae7281ed6cdf42d52f4323066b5e77840b40c73ec56d50500833886aa531cc14b6828abf48e9c1-6cb0b81573229f3b7c1198ad32dcff9a',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    });
})();
