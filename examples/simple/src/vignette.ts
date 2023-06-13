// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    SelectiveBloomEffect,
    BlendFunction,
    KernelSize,
    TiltShiftEffect,
    VignetteTechnique,
    VignetteEffect
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

    const vignetteEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction: BlendFunction.NORMAL,
        /** The Vignette darkness. (default: 0.5) */
        darkness: 0.5,
        /** The Vignette offset. (default: 0.5) */
        offset: 0.5,
        /** The Vignette technique. (default: VignetteTechnique.DEFAULT) */
        technique: VignetteTechnique.DEFAULT,
        type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
    })
    const vignetteEffect = <VignetteEffect>viewport.postProcessing.getEffect(vignetteEffectToken);    

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => vignetteEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => vignetteEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(vignetteEffect.blendMode.blendFunction)
        },
        <ISliderElement>{
            name: "darkness",
            type: "slider",
            onInputCallback: (value: any) => vignetteEffect.darkness = value,
            onChangeCallback: (value: any) => vignetteEffect.darkness = value,
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "offset",
            type: "slider",
            onInputCallback: (value: any) => vignetteEffect.offset = value,
            onChangeCallback: (value: any) => vignetteEffect.offset = value,
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01
        },
        <IDropdownElement>{
            name: "VignetteTechnique",
            type: "dropdown",
            onInputCallback: (value: any) => vignetteEffect.technique = Object.values(VignetteTechnique)[+value] as VignetteTechnique,
            onChangeCallback: (value: any) => vignetteEffect.technique = Object.values(VignetteTechnique)[+value] as VignetteTechnique,
            choices: Object.keys(VignetteTechnique),
            value: Object.values(VignetteTechnique).indexOf(vignetteEffect.technique)
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
