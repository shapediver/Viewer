import "reflect-metadata"
import { container } from "tsyringe";
import { api, Viewer, Session, Parameter, Export, Output, RENDERERTYPE, CAMERATYPE, LIGHTTYPE } from "@shapediver/viewer"
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;

// const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
// const ticket = 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61';
// const dataEngine: DataEngine = container.resolve(DataEngine);

// const glTFv2Button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('gltfv2button');
// const glTFv2Input: HTMLInputElement = <HTMLInputElement>document.getElementById('gltfv2uri');


// (async () => {
//     let viewer = await api.createViewer(RENDERERTYPE.STANDARD, <HTMLCanvasElement>document.getElementById('canvas'), 'myViewer')
//     await api.createSession(ticket, modelViewUrl, 'mySession');
//     viewer.show = true;
// })();

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