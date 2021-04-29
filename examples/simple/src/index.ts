import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, EVENTTYPE, LOGGINGLEVEL } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;

const modelViewUrl = 'https://sddev2.eu-central-1.shapediver.com';
const ticket = 'b9f44ac3145fa88868d141680445dbc2b31f1a87c3a6fe300a6794fe7020f2bf0e45e3dedd820dea8f2f319da0a8cf398b076f04f176e9c4a5c2ed62658260dd187baed87d604cb24ea651e998d0e186ee56337bd95498cf84ebfab1941c6efca63a3f5472ed18-7c11af81491ef193283764ecb1825a83';
const bearerToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvZGV2LWFwcC5zaGFwZWRpdmVyLmNvbVwvYXBpXC92MVwvdG9rZW5zIiwic3ViIjoiNGFjMDVjZDYtZmQ3Yy00NzAxLWIyNjAtNTRlYjdjYTc1ZGUwIiwiYXVkIjoiNWE5NzcxNjgtZjQ5ZC00M2VhLTgwNjMtYzg5Y2M5MDQyMzM1IiwiZXhwIjoxNjE5NTM1MzYwLCJzY29wZSI6Imdyb3VwLm93bmVyIGdyb3VwLmV4cG9ydCBncm91cC52aWV3IiwiaWF0IjoxNjE5NTMxNzYwfQ.bWn3V7cu_0TVtZskVmOt341RKWAZ0LWlVaQDx_vWbRO-XwvwpC96wCOiUVMuRMTMxjcqCRfe9jm9AVUF15fBus4DTCO_mdYYsWqW4lsta3YNC8GYr0k4UZW1hWpli4WarCiaViqg6uWSISiCn4-ypYsfAtiGBpwcVfTFSzvm8lCzokMKqRhFXW2W8SAxCrJzRLUQtmShPeXAxqwayEl65HKwasYucVDRASXGeZr_y648rOn0hNsvQKXZZiUE3x62LCeG6tSAYenLFM6u5KQPfZiSwa0xDeByNWlmRLweBxZ0dMnye-9XTVuqQQPiwm9t0qOVe6FYf_hWC27ubmnWfw';
const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);

const glTFv2Button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('gltfv2button');
const glTFv2Input: HTMLInputElement = <HTMLInputElement>document.getElementById('gltfv2uri');

const performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
const logger: Logger = <Logger>container.resolve(Logger);
performanceEvaluator.start('startup', window.performance.timing.connectStart);
performanceEvaluator.end('startup');
logger.info(performanceEvaluator.getEvaluationToString('startup'));

(async () => {
    let viewer = api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
    let session = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession'});
    performanceEvaluator.start('pageLoad_rendering', window.performance.timing.connectStart);
    performanceEvaluator.end('pageLoad_rendering');
    logger.info(performanceEvaluator.getEvaluationToString('pageLoad_rendering'));
    await new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    })
})();

glTFv2Button.onclick = async () => {
    const uri: string = glTFv2Input.value;
    const node = await dataEngine.loadContent({
        format: 'gltf',
        href: uri
    });
    api.sceneTree.addNode(node);
    api.update()
}

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