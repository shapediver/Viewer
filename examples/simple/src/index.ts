import "reflect-metadata"
import { container } from "tsyringe";
import { api } from "@shapediver/viewer"
import { RENDERERTYPE } from "@shapediver/viewer";
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine"

const modelViewUrl = 'https://sdeuc1.eu-central-1.shapediver.com';
const ticket = 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8';
const dataEngine: DataEngine = container.resolve(DataEngine);

const glTFv2Button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('gltfv2button');
const glTFv2Input: HTMLInputElement = <HTMLInputElement>document.getElementById('gltfv2uri');


(async () => {
    await api.createSession(ticket, modelViewUrl, 'mySession');
    await api.createViewer(RENDERERTYPE.THREEJS, <HTMLCanvasElement>document.getElementById('canvas'), 'myViewer')
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

(<any>window).sceneTree = api.sceneTree;
(<any>window).api = api;

// (<any>window).instances = async (count: number) => {
//     const session = api.getSession('mySession');
//     for(let x = 0; x < count; x++) {
//         for(let y = 0; y < count; y++) {
//             for(let z = 0; z < count; z++) {
//                 const instanceClone = session.node.cloneInstance();
//                 const translation = mat4.create();
//                 mat4.fromTranslation(translation, [x*100 - ((count-1)*100) / 2, y*25- ((count-1)*25) / 2, z*25- ((count-1)*25) / 2]);
//                 instanceClone.transformations.push({
//                     id: `transformation_x_${x}_y_${y}_z_${z}`,
//                     name: `transformation_x_${x}_y_${y}_z_${z}`,
//                     matrix: translation
//                 })
//                 api.sceneTree.addNode(instanceClone)
//             }
//         }
//     }
//     api.sceneTree.root.updateVersion();
//     api.onUpdate()
// }


(<any>window).changeParameter = async (name: string, value: string) => {
    const param = api.getSession('mySession').getParameterByName(name);
    for(let i = 0; i < param.length; i++)
        param[i].value = value;
    await api.getSession('mySession').customize();
}

(<any>window).addSDTFOutput = async (uri: string) => {
    const session = api.getSession('mySession');
    const output = session.createOutput('sdtfFile');
    output.content = [];
    output.content.push({
        format: 'sdtf',
        href: uri
    });
    await session.customize();
}