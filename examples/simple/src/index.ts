
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: 'c5a9e20e602562d59f401e6aaee1ed3da5d9e4390e916003a8f10b04d4e9f59a9b0d20aaccfbac6cfc561d42f1dc4e067f6603ce934950dc79a4f25ca7b54a35c6e666232ded196d97218506fd3bd030fddbd7626daa27cf822c2346a6fc9ba803f8af2f238d5a-021fc0f32c45533a40dec1e068196b1a',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com'
    })
})();