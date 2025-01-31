import * as SDV from '@shapediver/viewer';
import { createCustomUi, IBooleanElement, ISliderElement } from '@shapediver/viewer.shared.demo-helper';
(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        visibility: SDV.VISIBILITY_MODE.MANUAL
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

    const settings = SDV.defaultSettings['default'];
    await session.applySettings({ version: '', viewer: { config: settings() } }, { viewport: { ar: true, camera: true, environment: true, general: true, light: true, postprocessing: true, scene: true } });

    viewport.show = true;

    // create the parameter ui on the right side
    const uiDiv = document.createElement('div');
    uiDiv.style.position = 'absolute';
    uiDiv.style.width = '20rem';
    document.body.appendChild(uiDiv);
    createCustomUi([
        <IBooleanElement>{
            type: 'boolean',
            value: viewport.contactShadowVisibility,
            name: 'visibility',
            onChangeCallback: async (value: boolean) => {
                viewport.contactShadowVisibility = value;
            }
        },
        <ISliderElement>{
            type: 'slider',
            value: viewport.contactShadowHeight,
            min: 0,
            max: 1,
            step: 0.01,
            name: 'contactShadowHeight',
            onChangeCallback: async (value: number) => {
                viewport.contactShadowHeight = +value;
                viewport.update();
            }
        },
        <ISliderElement>{
            type: 'slider',
            value: viewport.contactShadowDarkness,
            min: 0,
            max: 10,
            step: 0.01,
            name: 'contactShadowDarkness',
            onChangeCallback: async (value: number) => {
                viewport.contactShadowDarkness = +value;
            }
        },
        <ISliderElement>{
            type: 'slider',
            value: viewport.contactShadowBlur,
            min: 0,
            max: 10,
            step: 0.01,
            name: 'contactShadowBlur',
            onChangeCallback: async (value: number) => {
                viewport.contactShadowBlur = +value;
            }
        },
        <ISliderElement>{
            type: 'slider',
            value: viewport.contactShadowOpacity,
            min: 0,
            max: 1,
            step: 0.01,
            name: 'contactShadowOpacity',
            onChangeCallback: async (value: number) => {
                viewport.contactShadowOpacity = +value;
            }
        }
    ], uiDiv);

})();
