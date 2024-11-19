import * as SDV from '@shapediver/viewer';
import { createUi } from '@shapediver/viewer.shared.demo-helper';
(<any>window).SDV = SDV;
import * as THREE from 'three';

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: '5639b4b1a184ae2e0a52e9081679eb9fb0adf66a3f364e21b5b32127b611428ba72565faa2211c813e00a60b51ca341660514b53ee2bbc01910960adecbf68c5d82f239a79c903e8e479e7a8d619f1b8c1c2eb32bb58472533338bdbe2ea982fa4f2ea2c1ebea1-9397f9a05c60e2872243817c72ede58d',
        modelViewUrl: 'https://sdr8euc1.eu-central-1.shapediver.com'
    });

    // create the parameter ui on the right side
    const parameterUiDiv = document.createElement("div");
    parameterUiDiv.style.position = "absolute";
    parameterUiDiv.style.width = "20rem";
    parameterUiDiv.style.overflow = "scroll";
    parameterUiDiv.style.height = "100%";
    document.body.appendChild(parameterUiDiv);
    createUi(session, parameterUiDiv);
})();
