// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    DepthOfFieldEffect,
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

    // we continuously render to see the changes made via the UI immediately.
    viewport.addFlag(SDV.FLAG_TYPE.CONTINUOUS_RENDERING)

    const depthOfFieldEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction: BlendFunction.NORMAL,
        /** The scale of the bokeh blur. (default: 1.0) */
        bokehScale: 1.0,
        /** The focal length. Range is [0.0, 1.0]. (default: 0.1) */
        focalLength: 0.1,
        /** The normalized focus distance. Range is [0.0, 1.0]. (default: 0.0) */
        focusDistance: 0.0,
        /** The focus range. Range is [0.0, 1.0]. (default: 0.1) */
        focusRange: 0.1,
        type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD
    })
    const depthOfFieldEffect = <DepthOfFieldEffect>viewport.postProcessing.getEffect(depthOfFieldEffectToken);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => depthOfFieldEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => depthOfFieldEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(depthOfFieldEffect.blendMode.blendFunction)
        },
        <ISliderElement>{
            name: "bokehScale",
            type: "slider",
            onInputCallback: (value: any) => depthOfFieldEffect.bokehScale = value,
            onChangeCallback: (value: any) => depthOfFieldEffect.bokehScale = value,
            value: 1,
            min: 0,
            max: 10,
            step: 0.01
        },
        <ISliderElement>{
            name: "focalLength",
            type: "slider",
            onInputCallback: (value: any) => depthOfFieldEffect.circleOfConfusionMaterial.focalLength = value,
            onChangeCallback: (value: any) => depthOfFieldEffect.circleOfConfusionMaterial.focalLength = value,
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "focusDistance",
            type: "slider",
            onInputCallback: (value: any) => depthOfFieldEffect.circleOfConfusionMaterial.focusDistance = value,
            onChangeCallback: (value: any) => depthOfFieldEffect.circleOfConfusionMaterial.focusDistance = value,
            value: 0.0,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "focusRange",
            type: "slider",
            onInputCallback: (value: any) => depthOfFieldEffect.circleOfConfusionMaterial.focusRange = value,
            onChangeCallback: (value: any) => depthOfFieldEffect.circleOfConfusionMaterial.focusRange = value,
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.001
        },
    ], document.getElementById("ui") as HTMLDivElement)
})();
