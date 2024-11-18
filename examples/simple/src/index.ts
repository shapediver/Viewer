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
        ticket: 'ae0549164b0a374b13c65e4d8114c1f0875bd686bd70580efb56121a816f280079caf5b7755e604418506e5d9319f80c6d4492be07f1785db3d98002a996c88c89ae2fbb7ddbb0355141b93762a45eda7437aa1ed4c4b3ad755bf355cd17a497e96715d9c46fa3-25db078ac51e607e80b62f1dfcb2f773',
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
    viewport.showStatistics = true;
})();
