
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;

(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: '05954626e18ed8e90a3d24a14ec5b243da764785f1953ab5217864d6f1d566861229146fb8386cf0099f9f1a005440093dec077043dd49c2b993e0ac0aa3c9eaff40bef92decacd9508d7a4eaae1b6cb657f4424dac1bd859eea1425dd3efc4f2b7e0b67dde101-08e21c8ce4c4ce11b9396570cedafe15',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com'
    })

    const b1 = await viewport.convertToGlTF();
    const a1 = document.createElement("a");
    a1.href = URL.createObjectURL(b1);
    a1.click();

    session.getParameterByName("Exterior Color")[0].value = "#ff0000";
    await session.customize();

    
    const b2 = await viewport.convertToGlTF();
    const a2 = document.createElement("a");
    a2.href = URL.createObjectURL(b2);
    a2.click();
})();