// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE,
    SelectiveBloomEffect,
    BlendFunction
} from "@shapediver/viewer";

import * as SDV from "@shapediver/viewer"
import { createCustomUi, IBooleanElement, IDropdownElement, ISliderElement } from "@shapediver/viewer.utils.demo-helper";
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

    const selectiveBloomEffectToken = viewport.postProcessing.addEffect({
        type: POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
        /** The blend function of this effect. (default: BlendFunction.ADD) */
        blendFunction: BlendFunction.ADD,
        /** The bloom intensity. (default: 1.0) */
        intensity: 1.0,
        /** The blur kernel size. (default: KernelSize.LARGE) */
        kernelSize: KernelSize.LARGE,
        /** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
        luminanceSmoothing: 0.025,
        /** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
        luminanceThreshold: 0.9,
        /** Enables or disables mipmap blur. (default: false) */
        mipmapBlur: true

    })
    const selectiveBloomEffect = <SelectiveBloomEffect>viewport.postProcessing.getEffect(selectiveBloomEffectToken);    
    viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => selectiveBloomEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => selectiveBloomEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(selectiveBloomEffect.blendMode.blendFunction)
        },
        <IBooleanElement>{
            name: "ignoreBackground",
            type: "boolean",
            onInputCallback: (value: any) => selectiveBloomEffect.ignoreBackground = value,
            onChangeCallback: (value: any) => selectiveBloomEffect.ignoreBackground = value,
            value: false
        },
        <ISliderElement>{
            name: "intensity",
            type: "slider",
            onInputCallback: (value: any) => selectiveBloomEffect.intensity = value,
            onChangeCallback: (value: any) => selectiveBloomEffect.intensity = value,
            value: 1,
            min: 0,
            max: 10,
            step: 0.01
        },
        <ISliderElement>{
            name: "luminanceSmoothing",
            type: "slider",
            onInputCallback: (value: any) => selectiveBloomEffect.luminanceMaterial.smoothing = value,
            onChangeCallback: (value: any) => selectiveBloomEffect.luminanceMaterial.smoothing = value,
            value: 0.025,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "luminanceThreshold",
            type: "slider",
            onInputCallback: (value: any) => selectiveBloomEffect.luminanceMaterial.threshold = value,
            onChangeCallback: (value: any) => selectiveBloomEffect.luminanceMaterial.threshold = value,
            value: 0.9,
            min: 0,
            max: 1,
            step: 0.001
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onInputCallback: (value: any) => selectiveBloomEffect.kernelSize = value,
            onChangeCallback: (value: any) => selectiveBloomEffect.kernelSize = value,
            choices: Object.keys(KernelSize),
            value: KernelSize.LARGE
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
