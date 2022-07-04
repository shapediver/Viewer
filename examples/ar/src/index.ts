import { createSession, createViewport, viewports } from "@shapediver/viewer";

(async () => {
    let viewer = await createViewport({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewport' });
    let session = await createSession({ 
        ticket: 'd2795be17bb5f36ad8e799cd58c35b4fb84e84cb7ef5b8aa1365b7fe76fcaf3234167f0924fa613f03f31f82057b3107631c003bcc9077f785d38ad9a354a489e652d2be97a8e1f69c975bba070727b28f24af7ff68a9c966a124121362de07f6aecbdb9ebc46a-c13747650a644e02d24c0579cc104655', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession'
    });
})();

(<any>window).loadAR = async () => {
    if(viewports['myViewport'].viewableInAR()) {
        await viewports['myViewport'].viewInAR();
    } else {
        alert('Hello there! Unfortunately, you cannot use the AR feature. The AR feature is available on Android (all browsers except Firefox) and on iOS (all browsers except Firefox and Chrome).')
    }
}