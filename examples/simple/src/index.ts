import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, EVENTTYPE, LOGGINGLEVEL } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;

const ticket = 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8';
const ticket2 = '8392f2ab5231da0d1b634ef6eb849be4c6e79c0e84456ca19fe03a4d1078fd02428704e23ee9b51e691ffb60550ea8f91493fa669ac900f86061e755441cf3da11c21d81dacf7975ba024ce9b604f2de708895dcdf4d4a17ca885516399e29111fc6d7f22e8ef1000651f56c91b4841a5527cb3d228b-0c9680ec95458327deab37e9fc1a432c-60d25599bc8a340ddf70ffff0dca331d';
const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
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
    let session = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession'});
    let viewer = api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
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