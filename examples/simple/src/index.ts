import * as SDV from '@shapediver/viewer';
import { createUi } from '@shapediver/viewer.shared.demo-helper';
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
        ticket: ticket ?? 'aa8f99304bdad13693a123c9187a6a764c13345c448814ad7c70d79dae1b555b72795fbb2fd6faa368ff8cdee1368821771bec38f4b39c5e9fb7955be8c2b5f8f8da605fd4cdc1708402118ad706e8578a108c1fb6b6429f1e7279e19b12d0944a317848fa3ba8-78c86ce3f2f177c0b6ac5dafbb94e84e',
        modelViewUrl: modelViewUrl ?? 'https://sdr8euc1.eu-central-1.shapediver.com'
    });

    // create the parameter ui on the right side
    const parameterUiDiv = document.createElement('div');
    parameterUiDiv.style.position = 'absolute';
    parameterUiDiv.style.width = '20rem';
    parameterUiDiv.style.overflow = 'scroll';
    parameterUiDiv.style.height = '100%';
    document.body.appendChild(parameterUiDiv);
    createUi(session, parameterUiDiv);
})();