import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;
let delta_v2 = 0, delta_v3 = 0;

const submitButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('submitButton');

submitButton.onclick = async () => {
    const ticket = (<HTMLInputElement>document.getElementById('ticket')).value;
    const modelViewUrl = (<HTMLInputElement>document.getElementById('modelViewUrl')).value;

    let performance_v3 = performance.now();
    let session = await api.createSession({ ticket, modelViewUrl, id: 'mySession'});
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
    delta_v3 = performance.now() - performance_v3;

    const initSdvApp = () => {
        let performance_v2 = performance.now();
        (<any>window).api_v2 = new (<any>window).SDVApp.ParametricViewer({ container: document.getElementById('SDV-container'), ticket, modelViewUrl, showControlsInitial: false, showSettingsInitial: false });
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