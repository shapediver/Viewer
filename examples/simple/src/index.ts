import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;

const modelViewUrl = 'https://sddev2.eu-central-1.shapediver.com:443';
const ticket = '601e5b0e326c6bce15bbc6ac397e0e9e23db5b094b9e2f39e132436cc8dbb005a2d63563f8ad9ca7ac53b1b2b8714b8be6fed5fec27bfd788f0d08119c0eda462b0a22d20fb580e58fbf21197560a015ae65c94ad5aa894f77b3a7bac9eec6ba568c296ad4f7574922ecd0e733eb9bc3e842956abc-cfc5548fb37e476f774fa890c45efe0c';
// const dataEngine: DataEngine = container.resolve(DataEngine);

// const glTFv2Button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('gltfv2button');
// const glTFv2Input: HTMLInputElement = <HTMLInputElement>document.getElementById('gltfv2uri');

const performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
const logger = <Logger>container.resolve(Logger);
performanceEvaluator.start('startup', window.performance.timing.connectStart);
performanceEvaluator.end('startup');
logger.info(performanceEvaluator.getEvaluationToString('startup'));

(async () => {
    let viewer = await api.createViewer(RENDERERTYPE.STANDARD, <HTMLCanvasElement>document.getElementById('canvas'), 'myViewer')
    let session = await api.createSession(ticket, modelViewUrl, undefined, 'mySession');
    if(session.initialized) viewer.show = true;
    performanceEvaluator.start('pageLoad_rendering', window.performance.timing.connectStart);
    performanceEvaluator.end('pageLoad_rendering');
    logger.info(performanceEvaluator.getEvaluationToString('pageLoad_rendering'));
})();

// // glTFv2Button.onclick = async () => {
// //     const uri: string = glTFv2Input.value;
// //     const node = await dataEngine.loadContent({
// //         format: 'gltf',
// //         href: uri
// //     });
// //     api.sceneTree.addNode(node);
// //     api.update()
// // }

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