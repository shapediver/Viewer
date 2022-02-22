

import { api, DataEngine } from '@shapediver/viewer';
import { container } from 'tsyringe';

(<any>window).api = api;

const tickets = [
    '3cb050133c817bcc84458c8960de3483fcaa3a74626e81e6a4edbeaf32714ad8d871949b460196a958f4cc8bd447682bc0011bb72f891a3cd8a6286db80406626dea8c36805ac6cacfd691155740fe61b458f31d7405b9beedffc518775625d692c2109ad4a21e-9bd57d7b4328c670c9edfe9dc826497a',
    'bd2771c0df2eaf45b8e9d290a37f4470a644ca71406fd9d81f5e53abdf3a47f06619ec2369ac3c1a572f68716579083bb5ec2ffcd8ccd8579ae7bb805ebffeeb759522a10d9aebe17e7095ec44531e81a4d69f6813f929b497eb0759489f3094d1c68149cb6498-79280110eaf8c55d095ca4b40b6e300f',
    'd30731eb75e2a479c89e5783094edf5593cdd08ef6d07d00ea690afadd6b45af59fb96a1b302d03fe83f0508ad6cfdce71dcc274e0281df6f97dd109e37dd670db307fb75010562e7b9458fa825b952edb75548385d6c5a6ce45e8823ecedc601e3ff2589733f2-8dff5594e0e5ac13cc71c8bfcdda79c4',
    'bf2f5b9025425d56b8fb088a038f962fffa91ddfc092b99aef933e15b7387ad9ecc2190fc95d7b9b91c55a811da8fcf54f571936af3ccb52dce85d6318d137db84aa3990e580778a34fc3ab55cc51c34cb9ef9885b312274e2c02535b0590744840721ca00989c-01aca8e6f0344c021ab8c4d695d9b3e3'
];

(async () => {
    let viewer1 = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewer1' });
    let viewer2 = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer2' });
    let session = await api.createSession({ 
        ticket: tickets[0], 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
        excludeViewers: ['myViewer2']
    });
    api.autoScaling = false;

    // convert GLTF
    const blob = await api.convertSceneToGLTF(true);

    // load it again in other viewer
    const file = new Blob([blob], {type: 'model/gltf-binary'});
    const fileURL = URL.createObjectURL(file);
    const node = await container.resolve(DataEngine).loadContent({
        format: 'gltf',
        href: fileURL
    })
    node.excludeViewers.push('myViewer1');
    node.updateVersion();
    api.sceneTree.addNode(node);
    api.update()
})();