
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: '436f71c116379fa4afffebef5d2f08e8815cb1c0e60ecf5402d743db4b947fa4a73d3d133912af11fcf54bb504c072f9776db8a886ad169035bb9133137e109ce4aea160629b0393251d22d4162317e3acc8e9d39ad8d57037c97b16f87d21a30ce706ee5a9c55-f245c0b5a314f6859406b74b0b432944',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    })
})();