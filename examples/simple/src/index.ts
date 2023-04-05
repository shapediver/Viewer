
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: '30ebb733b595c280895edc7179e8b5c4a96d77b8d045c2d14c69aae9744b3c61c59fac11f852328cd3ac52088a2ef7cdcbbb100927e100e6f85a2ae43676c283b0f9577cb89d3adffb784c326e29c8933374fabcf0f215886d81893d1a0578e532dc7673ba3b37-5bca1a5cdb6eb7a1f956c702d4fbe42d',
        modelViewUrl: 'https://sddev3.eu-central-1.shapediver.com'
    })
})();