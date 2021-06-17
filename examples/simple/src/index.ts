import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, EVENTTYPE, LOGGINGLEVEL, PerspectiveCamera } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";
import { SettingsEngine } from "@shapediver/viewer.shared.services";
import { vec3 } from "gl-matrix";

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;

const ticket5 = 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61';
const ticket = 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e';
const ticket2 = '8392f2ab5231da0d1b634ef6eb849be4c6e79c0e84456ca19fe03a4d1078fd02428704e23ee9b51e691ffb60550ea8f91493fa669ac900f86061e755441cf3da11c21d81dacf7975ba024ce9b604f2de708895dcdf4d4a17ca885516399e29111fc6d7f22e8ef1000651f56c91b4841a5527cb3d228b-0c9680ec95458327deab37e9fc1a432c-60d25599bc8a340ddf70ffff0dca331d';
const ticket3 = 'd97a0d69723018a16376de727c0a6cad943ba65fe9b0d776468ea891fcc80019e98d27e09a75ad8f806f788000bc6abc57ff8bd90390c8c815f951893bea0995d8f754a9941c1db55131fb7c020b1d94be862d1ef65cfab3af6dafc60ca26c92ddb262b5a1e9bf-fc3e6089360835fe91bdda04be4b5e0b';
// const ticket4 = '5151fd6862510d24c9b9bb6f94fbe6d9579db91bc9d39c8eb5f43e3619da0a332ce29e5466caf24936616dad9bc7706b4cd30a24e2a8072adb490dc082a8ac04a0219b791f724f04f9a68b5e305c1748b3518e5e741f8304ecf940ffa7f5ea03b8e29d70b6cb89fd11fc42d3c35ecb29d2b2d154c1-a31625ab120de0ba812d714cab23ca4b';
const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
const modelViewUrl2 = 'https://sddev2.eu-central-1.shapediver.com';
const bearerToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvZGV2LWFwcC5zaGFwZWRpdmVyLmNvbVwvYXBpXC92MVwvdG9rZW5zIiwic3ViIjoiNGFjMDVjZDYtZmQ3Yy00NzAxLWIyNjAtNTRlYjdjYTc1ZGUwIiwiYXVkIjoiNWE5NzcxNjgtZjQ5ZC00M2VhLTgwNjMtYzg5Y2M5MDQyMzM1IiwiZXhwIjoxNjE5NTM1MzYwLCJzY29wZSI6Imdyb3VwLm93bmVyIGdyb3VwLmV4cG9ydCBncm91cC52aWV3IiwiaWF0IjoxNjE5NTMxNzYwfQ.bWn3V7cu_0TVtZskVmOt341RKWAZ0LWlVaQDx_vWbRO-XwvwpC96wCOiUVMuRMTMxjcqCRfe9jm9AVUF15fBus4DTCO_mdYYsWqW4lsta3YNC8GYr0k4UZW1hWpli4WarCiaViqg6uWSISiCn4-ypYsfAtiGBpwcVfTFSzvm8lCzokMKqRhFXW2W8SAxCrJzRLUQtmShPeXAxqwayEl65HKwasYucVDRASXGeZr_y648rOn0hNsvQKXZZiUE3x62LCeG6tSAYenLFM6u5KQPfZiSwa0xDeByNWlmRLweBxZ0dMnye-9XTVuqQQPiwm9t0qOVe6FYf_hWC27ubmnWfw';
const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
(<any>window).settingsEngine = <SettingsEngine>container.resolve(SettingsEngine);


const performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
const logger: Logger = <Logger>container.resolve(Logger);
performanceEvaluator.start('startup', window.performance.timing.connectStart);
performanceEvaluator.end('startup');
logger.info(performanceEvaluator.getEvaluationToString('startup'));

(async () => {
    let session = await api.createAndInitializeSession({ ticket: ticket, modelViewUrl: modelViewUrl, id: 'mySession'});
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
    performanceEvaluator.start('pageLoad_rendering', window.performance.timing.connectStart);
    performanceEvaluator.end('pageLoad_rendering');
    logger.info(performanceEvaluator.getEvaluationToString('pageLoad_rendering'));
    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
})();

(<any>window).resetSettings = async () => {
    const session = api.getSession('mySession');
    session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.updateDisplayName('COLOR');

    session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.updateOrder(0);
    session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.updateOrder(1);
    session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.updateOrder(2);
    session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.updateOrder(3);
    session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.updateOrder(4);
    session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.updateOrder(5);
    session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.updateOrder(6);
    session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.updateOrder(7);
    session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.updateOrder(8);
    session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.updateOrder(9);
    session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.updateOrder(10);

    session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.updateHidden(true);
    session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.updateHidden(true);
    session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.updateHidden(true);
    session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.updateHidden(true);
    session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.updateHidden(true);
    session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.updateHidden(true);
    session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.updateHidden(false);
    session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.updateHidden(true);
    session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.updateHidden(true);
    session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.updateHidden(true);
    session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.updateHidden(false);

    const viewer = api.getViewer('myViewer');
    viewer.updateBlurSceneWhenBusy(true);
    const camera = viewer.getCamera();
    camera!.updateAutoAdjust(false);
    camera!.updateCameraMovementDuration(800);
    camera!.updateDefaultPosition([58.03696060180664, -290.11590576171875, 87.67756652832031]);
    camera!.updateDefaultTarget([0, 7, -3.25]);
    (<PerspectiveCamera>camera!).updateFov(45);
    (<PerspectiveCamera>camera!).controls.updateAutoRotationSpeed(0);
    (<PerspectiveCamera>camera!).controls.updateDamping(0.1);
    viewer.updateEnvironmentMap('none');
    viewer.updateGridVisibility(true);
    viewer.updateGroundPlaneVisibility(true);
    viewer.updateEnvironmentMap('none');

    const lights = viewer.getLights();
    for(let l in lights) {
        viewer.removeLight(l)
    }
    viewer.addAmbientLight({color: '#ffffff', intensity: 0.5, name: 'ambient0'});
    viewer.addDirectionalLight({color: '#ffffff', intensity: 0.75, direction: [0.5774000287055969, -0.5774000287055969, 0.5774000287055969], castShadow: true, name: 'directional0', shadowMapResolution: 1024, shadowMapBias: -0.00175});
    viewer.addDirectionalLight({color: '#ffffff', intensity: 0.35, direction: [.25, -1, 1], castShadow: false, name: 'directional1', shadowMapResolution: 1024, shadowMapBias: -0.00175});
    await session.saveSettings();
};


(<any>window).saveSettings = async () => {
    const session = api.getSession('mySession');
    await session.saveSettings();
};

// (<any>window).sceneTree = api.sceneTree;
// (<any>window).api = api;

// // (<any>window).instances = async (count: number) => {
// //     const session = api.getSession('mySession');
// //     for(let x = 0; x < count; x++) {
// //         for(let y = 0; y < count; y++) {
// //             for(let z = 0; z < count; z++) {
// //                 const instanceClone = session.node.cloneInstance();
// //                 const translation = mat4.create();
// //                 mat4.fromTranslation(translation, [x*100 - ((count-1)*100) / 2, y*25- ((count-1)*25) / 2, z*25- ((count-1)*25) / 2]);
// //                 instanceClone.transformations.push({
// //                     id: `transformation_x_${x}_y_${y}_z_${z}`,
// //                     name: `transformation_x_${x}_y_${y}_z_${z}`,
// //                     matrix: translation
// //                 })
// //                 api.sceneTree.addNode(instanceClone)
// //             }
// //         }
// //     }
// //     api.sceneTree.root.updateVersion();
// //     api.onUpdate()
// // }


// (<any>window).changeParameter = async (name: string, value: string) => {
//     const param = api.getSession('mySession').getParameterByName(name);
//     for(let i = 0; i < param.length; i++)
//         param[i].value = value;
//     await api.getSession('mySession').customize();
// }

// (<any>window).addSDTFOutput = async (uri: string) => {
//     const session = api.getSession('mySession');
//     const output = session.createOutput('sdtfFile');
//     output.content = [];
//     output.content.push({
//         format: 'sdtf',
//         href: uri
//     });
//     await session.customize();
// }