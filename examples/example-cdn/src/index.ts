(async () => {
    const SDV = (<any>window).SDV;
    const viewer = await SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await SDV.api.createSession({ 
        ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
        id: 'mySession' 
    });
})()