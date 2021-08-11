import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'

(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).ORTHOGRAPHIC_CAMERA_DIRECTION = ORTHOGRAPHIC_CAMERA_DIRECTION;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).VISIBILITYMODE = VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
(<any>window).EVENTTYPE = EVENTTYPE;
(<any>window).EXPORTTYPE = EXPORTTYPE;
(<any>window).PARAMETERTYPE = PARAMETERTYPE;
(<any>window).PARAMETERVISUALIZATION = PARAMETERVISUALIZATION;
(<any>window).ENVIRONMENTMAP = ENVIRONMENTMAP;

(<any>window).api_v3 = api;
(<any>window).sceneTree = api.sceneTree;
let delta_v2 = 0, delta_v3 = 0;

const submitButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('submitButton');

submitButton.onclick = async () => {
    const ticket = (<HTMLInputElement>document.getElementById('ticket')).value;
    const modelViewUrl = (<HTMLInputElement>document.getElementById('modelViewUrl')).value;

    let performance_v3 = performance.now();
    let session = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession'});
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
    delta_v3 = performance.now() - performance_v3;

    const initSdvApp = () => {
        let performance_v2 = performance.now();
        (<any>window).api_v2 = new (<any>window).SDVApp.ParametricViewer({ container: document.getElementById('sdv-container'), ticket, modelViewUrl, showControlsInitial: false, showSettingsInitial: false });
        (<any>window).api_v2.scene.addEventListener((<any>window).api_v2.scene.EVENTTYPE.RENDER_BEAUTY_END, () => {
            delta_v2 = performance.now() - performance_v2;
        });
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSdvApp, false);
    } else {
        initSdvApp();
    }
}