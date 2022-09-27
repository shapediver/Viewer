
import { createSession, createViewport, sceneTree } from '@shapediver/viewer';
import { GLTFConverter } from '@shapediver/viewer.data-engine.gltf-converter';
import { mat4 } from 'gl-matrix';
import { container } from 'tsyringe';
import * as SDV from '@shapediver/viewer';

(<any>window).SDV = SDV;
const gltfConverter: GLTFConverter = <GLTFConverter>container.resolve(GLTFConverter);

(async () => {
    let viewport = await createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await createSession({
        id: 'mySession',
        ticket: '5e1bfd1dbf8a12d5e02342f86d8d34337b7eabf13c8e5acaf79ac293531987bd11a275461b048b250869c6f39a259467282be9b39c147706e4ee419a0149d609422e89a45e6945fe4f510941a166052292c6c8d68e154a912a990e62d5d51f557d66e6d284e011-816b094631de72d00d960f0de90c0206',
        modelViewUrl: 'https://nsc006.us-east-1.shapediver.com'
    })

    
        let scalingMatrix: mat4 = mat4.fromScaling(mat4.create(), [0.001, 0.001,0.001]);
        session.node.transformations.push({ id: 'ar_scaling', matrix: scalingMatrix })
        session.node.updateVersion()
        viewport.update()

        viewport.camera?.zoomTo()
})();