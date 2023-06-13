// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    SelectiveBloomEffect,
    BlendFunction,
    KernelSize,
    TiltShiftEffect
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

    const tiltShiftEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction: BlendFunction.NORMAL,
        /** The softness of the focus area edges. (default: 0.3) */
        feather: 0.3,
        /** The relative size of the focus area. (default: 0.4) */
        focusArea: 0.4,
        /** The blur kernel size. (default: KernelSize.MEDIUM) */
        kernelSize: KernelSize.MEDIUM,
        /** The relative offset of the focus area. (default: 0.0) */
        offset: 0,
        /** The rotation of the focus area in radians. (default: 0.0) */
        rotation: 0,
        type: POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,
    })
    const tiltShiftEffect = <TiltShiftEffect>viewport.postProcessing.getEffect(tiltShiftEffectToken);    

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => tiltShiftEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => tiltShiftEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(tiltShiftEffect.blendMode.blendFunction)
        },
        <ISliderElement>{
            name: "feather",
            type: "slider",
            onInputCallback: (value: any) => tiltShiftEffect.feather = value,
            onChangeCallback: (value: any) => tiltShiftEffect.feather = value,
            value: 0.3,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "focusArea",
            type: "slider",
            onInputCallback: (value: any) => tiltShiftEffect.focusArea = value,
            onChangeCallback: (value: any) => tiltShiftEffect.focusArea = value,
            value: 0.4,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "offset",
            type: "slider",
            onInputCallback: (value: any) => tiltShiftEffect.offset = value,
            onChangeCallback: (value: any) => tiltShiftEffect.offset = value,
            value: 0,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "rotation",
            type: "slider",
            onInputCallback: (value: any) => tiltShiftEffect.rotation = value,
            onChangeCallback: (value: any) => tiltShiftEffect.rotation = value,
            value: 0,
            min: 0,
            max: 1,
            step: 0.01
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onInputCallback: (value: any) => tiltShiftEffect.blurPass.kernelSize = value,
            onChangeCallback: (value: any) => tiltShiftEffect.blurPass.kernelSize = value,
            choices: Object.keys(KernelSize),
            value: KernelSize.LARGE
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
