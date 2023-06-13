// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    GridEffect,
    BlendFunction
} from "@shapediver/viewer";

import * as SDV from "@shapediver/viewer"
import { createCustomUi, IDropdownElement, ISliderElement } from "@shapediver/viewer.utils.demo-helper";
(<any>window).SDV = SDV;

(async () => {
    // create a viewport
    const viewport = await createViewport({
        canvas: document.getElementById("canvas") as HTMLCanvasElement,
        id: "myViewport"
    });
    // create a session
    const session = await createSession({
        ticket:
            "319f14f08c1e67a874fd843acecfd321049772deb0cdb5a0dbb39385592a156e83730e45c5e7af5eab52e15b1e36d44a092f71ada1331e1935b0f25d9448af34d0add0bd5abf8984325b97ee9e6106b25216446d15a86bb18b40114df89d2f5909b08e8c8b9eeb-7516be37cb2d968a0b3c545baf3ae51e",
        modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
        id: "mySession"
    });
    viewport.addFlag(SDV.FLAG_TYPE.CONTINUOUS_RENDERING)
    
    viewport.postProcessing.addEffect({
        type: POST_PROCESSING_EFFECT_TYPE.SMAA
    })

    const gridEffectToken = viewport.postProcessing.addEffect({
        type: POST_PROCESSING_EFFECT_TYPE.GRID,
        /** The blend function of this effect. (default: BlendFunction.OVERLAY) */
        blendFunction: BlendFunction.OVERLAY,
        /** The line width of the grid pattern. (default: 0.0) */
        lineWidth: 0.0,
        /** The scale of the grid pattern. (default: 1.0) */
        scale: 1.0,
    })
    const gridEffect = <GridEffect>viewport.postProcessing.getEffect(gridEffectToken);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => gridEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => gridEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(gridEffect.blendMode.blendFunction)
        },
        <ISliderElement>{
            name: "lineWidth",
            type: "slider",
            onInputCallback: (value: any) => gridEffect.lineWidth = value,
            onChangeCallback: (value: any) => gridEffect.lineWidth = value,
            value: 0,
            min: 0,
            max: 10,
            step: 0.001
        },
        <ISliderElement>{
            name: "scale",
            type: "slider",
            onInputCallback: (value: any) => gridEffect.scale = value,
            onChangeCallback: (value: any) => gridEffect.scale = value,
            value: 1,
            min: 0,
            max: 10,
            step: 0.001
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();