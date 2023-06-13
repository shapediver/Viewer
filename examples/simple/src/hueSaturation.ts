// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    HueSaturationEffect,
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

    const hueSaturationEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction: BlendFunction.NORMAL,
        /** The hue in radians. (default: 0.0) */
        hue: 0,
        /** The saturation factor, ranging from -1 to 1, where 0 means no change. (default: 0.0) */
        saturation: 0,
        type: POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION
    })
    const hueSaturationEffect = <HueSaturationEffect>viewport.postProcessing.getEffect(hueSaturationEffectToken);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => hueSaturationEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => hueSaturationEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(hueSaturationEffect.blendMode.blendFunction)
        },
        <ISliderElement>{
            name: "hue",
            type: "slider",
            onInputCallback: (value: any) => hueSaturationEffect.hue = value,
            onChangeCallback: (value: any) => hueSaturationEffect.hue = value,
            value: 0,
            min: -3.14,
            max: 3.14,
            step: 0.001
        },
        <ISliderElement>{
            name: "saturation",
            type: "slider",
            onInputCallback: (value: any) => hueSaturationEffect.saturation = value,
            onChangeCallback: (value: any) => hueSaturationEffect.saturation = value,
            value: 0,
            min: -1,
            max: 1,
            step: 0.001
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();