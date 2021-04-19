import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, EVENTTYPE, LOGGINGLEVEL } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"
import { Logger, PerformanceEvaluator } from "@shapediver/viewer.shared.monitoring";

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;

const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
const ticket = 'af10d827e31b1dd4b2f3a69d09c67484d4286daf1fd6dd132f6242fd188e7ff51b4af0aca780765b778a914dd07445a1fa1046e97987ca371408f3163b040e6072b160b168e1adb02f6e7cc60b3fb2c40104f2a6ea98862cc17cefcbed6b00bcd63c0de25f4caee0116875e3c4d8c5e56167f4af15c2-caaecb0cd50e810a5b3c1b47e8fec751';
const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);

const glTFv2Button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('gltfv2button');
const glTFv2Input: HTMLInputElement = <HTMLInputElement>document.getElementById('gltfv2uri');

const performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
const logger: Logger = <Logger>container.resolve(Logger);
performanceEvaluator.start('startup', window.performance.timing.connectStart);
performanceEvaluator.end('startup');
logger.info(performanceEvaluator.getEvaluationToString('startup'));

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' })
    let session = await api.createSession({ ticket, modelViewUrl, id: 'mySession'});
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