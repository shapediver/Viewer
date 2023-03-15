import { createSession, createViewport, viewports } from "@shapediver/viewer";

(async () => {
    let viewer = await createViewport({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewport' });
    let session = await createSession({ 
        ticket: '95469c9c2f258fcf1e0221a1318e75cf16f8e5ee4d74b2fec799b1b9ab90a34b7db7c825275e54649d021953fc7f2b624e05b0b081d266128c08afb1197ca688c06753f14a3008be9a3678c543be4c06ffdae9d009e6570419fb85f36793f3d4aa88302e6e8a7e-d54a78fbbbe3dc91095d4ceedbff51bf', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession'
    });
})();

(<any>window).loadAR = async () => {
    if(viewports['myViewport'].viewableInAR()) {
        await viewports['myViewport'].viewInAR();
    } else {
        const qr = await viewports['myViewport'].createArSessionLink(undefined, true);
        const image = new Image();
        image.src = qr;
        image.style.position = "absolute";
        image.style.bottom = "0%";
        document.body.appendChild(image);
    }
}