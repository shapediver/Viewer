import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: '283364d960ceb3d95c8bbda77ea9d0186e9ac2ad26b177b41bd06ecc1601bb6c14da10994886ab2f36e1b4c0c8537a07e636f1eceb23a824877cc7858633182541a165dd431f67cc1fcf1e9ae82359de62edabaacfec1447c622f16d088c9c13cc39becc8623af-7a95a07f6d94215329ce13927d7ca70c',
        modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com'
    });
})();
