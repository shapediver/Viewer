
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: '2a98a50b98fc37a65612e19ddc1c660a1335d1eaebc09a595e1e1cef4402ea7f24325c840bba11e69cf5596347229a164e2eca14f39041cae6146bdfdab320b31acd7a077099d600805e215f79bf4cd0880ced268290385b6d9a4dda82e9bac52738734b4defca-4c3aab65c18be4a6c6f42a3cb97f347f',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    })
})();