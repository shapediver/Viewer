// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    BlendFunction,
    ChromaticAberrationEffect,
    createSession,
    createViewport,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE
} from "@shapediver/viewer";

import * as SDV from "@shapediver/viewer"
import { createCustomUi, IBooleanElement, IColorElement, IDropdownElement, ISliderElement } from "@shapediver/viewer.utils.demo-helper";
(<any>window).SDV = SDV;
import * as THREE from "three"

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

    const chromaticAberrationEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction: BlendFunction.NORMAL,
        /** The modulation offset. Only applies if `radialModulation` is enabled. (default: 0.15) */
        modulationOffset: 0.15,
        /** The color offset. (default: [0.001, 0.0005]) */
        offset: [0.001, 0.0005],
        /** Whether the effect should be modulated with a radial gradient. (default: false) */
        radialModulation: false,
        type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION
    })
    const chromaticAberrationEffect = <ChromaticAberrationEffect>viewport.postProcessing.getEffect(chromaticAberrationEffectToken);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => chromaticAberrationEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => chromaticAberrationEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(chromaticAberrationEffect.blendMode.blendFunction)
        },
        <IBooleanElement>{
            name: "radialModulation",
            type: "boolean",
            onInputCallback: (value: any) => chromaticAberrationEffect.radialModulation = value,
            onChangeCallback: (value: any) => chromaticAberrationEffect.radialModulation = value,
            value: false
        },
        <ISliderElement>{
            name: "offset - x",
            type: "slider",
            onInputCallback: (value: any) => chromaticAberrationEffect.offset = new THREE.Vector2(value, chromaticAberrationEffect.offset.y),
            onChangeCallback: (value: any) => chromaticAberrationEffect.offset = new THREE.Vector2(value, chromaticAberrationEffect.offset.y),
            value: 0.001,
            min: 0,
            max: 1,
            step: 0.0001
        },
        <ISliderElement>{
            name: "offset - y",
            type: "slider",
            onInputCallback: (value: any) => chromaticAberrationEffect.offset = new THREE.Vector2(chromaticAberrationEffect.offset.x, value),
            onChangeCallback: (value: any) => chromaticAberrationEffect.offset = new THREE.Vector2(chromaticAberrationEffect.offset.x, value),
            value: 0.0005,
            min: 0,
            max: 1,
            step: 0.0001
        },
        <ISliderElement>{
            name: "modulationOffset",
            type: "slider",
            onInputCallback: (value: any) => chromaticAberrationEffect.modulationOffset = value,
            onChangeCallback: (value: any) => chromaticAberrationEffect.modulationOffset = value,
            value: 0.15,
            min: 0,
            max: 1,
            step: 0.0001
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
