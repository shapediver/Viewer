import * as SDV from '@shapediver/viewer';
import { createCustomUi, IBooleanElement, ISliderElement } from '@shapediver/viewer.shared.demo-helper';
(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });

    // read out query parameters for "ticket" and "modelViewUrl"
    const urlParams = new URLSearchParams(window.location.search);
    const ticket = urlParams.get('ticket');
    const modelViewUrl = urlParams.get('modelViewUrl');

    const session = await SDV.createSession({
        id: 'mySession',
        ticket: ticket ?? 'a63ca5e1316bd6ca60e4c2ac679e1cd857ce81f3f4fb2a41f65d671a614dd80144a9a0184326021130e254097e3034b0e97ca501d288bbf03a88ea488f941b8b3d43e2c20c074d3e13669a1b3df3cd7ff1e30fc6857a97957b9c800fa91d95b0d137e6cefe0991-c09098a232337160689974cc2734d454',
        modelViewUrl: modelViewUrl ?? 'https://sddev3.eu-central-1.shapediver.com'
    });


})();
