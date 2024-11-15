import * as SDV from '@shapediver/viewer';
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


    viewport.showStatistics = true;

    const point = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 1, 0xff0000);

    session.node.addData(new SDV.ThreejsData(point));
    session.node.updateVersion();
})();
