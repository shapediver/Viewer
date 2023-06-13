// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    BlendFunction,
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    SSAOEffect
} from "@shapediver/viewer";

import * as SDV from "@shapediver/viewer"
import { createCustomUi, IBooleanElement, IColorElement, IDropdownElement, ISliderElement } from "@shapediver/viewer.utils.demo-helper";
import * as THREE from "three"
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

    const ssaoEffectToken = viewport.postProcessing.addEffect({
        /** An occlusion bias. Eliminates artifacts caused by depth discontinuities. (default: 0.025) */
        bias: 0.025,
        /** The blend function of this effect. (default: BlendFunction.MULTIPLY) */
        blendFunction: BlendFunction.MULTIPLY,
        /** The color of the ambient occlusion. (default: #000000) */
        color: "#000000",
        /** Enables or disables depth-aware upsampling. Has no effect if WebGL 2 is not supported. (default: true) */
        depthAwareUpsampling: true,
        /** Influences the smoothness of the shadows. A lower value results in higher contrast. (default: 0.01) */
        fade: 0.01,
        /** The intensity of the ambient occlusion. (default: 1.0) */
        intensity: 1.0,
        /** Determines how much the luminance of the scene influences the ambient occlusion. (default: 0.7) */
        luminanceInfluence: 0.7,
        /** The minimum radius scale. (default: 0.1) */
        minRadiusScale: 0.1,
        /** The occlusion sampling radius, expressed as a scale relative to the resolution. Range [1e-6, 1.0]. (default: 0.1825) */
        radius: 0.1825,
        /** The amount of spiral turns in the occlusion sampling pattern. Should be a prime number. (default: 7) */
        rings: 7,
        /** The amount of samples per pixel. Should not be a multiple of the ring count. (default: 9) */
        samples: 9,
        type: POST_PROCESSING_EFFECT_TYPE.SSAO
    })
    const ssaoEffect = <SSAOEffect>viewport.postProcessing.getEffect(ssaoEffectToken);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => ssaoEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => ssaoEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(ssaoEffect.blendMode.blendFunction)
        },
        <IColorElement>{
            name: "color",
            type: "color",
            onInputCallback: (value: any) => ssaoEffect.color = new THREE.Color(value),
            onChangeCallback: (value: any) => ssaoEffect.color = new THREE.Color(value),
            value: "#000000"
        },
        <IBooleanElement>{
            name: "depthAwareUpsampling",
            type: "boolean",
            onInputCallback: (value: any) => ssaoEffect.depthAwareUpsampling = value,
            onChangeCallback: (value: any) => ssaoEffect.depthAwareUpsampling = value,
            value: true
        },
        <ISliderElement>{
            name: "bias",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.ssaoMaterial.bias = value,
            onChangeCallback: (value: any) => ssaoEffect.ssaoMaterial.bias = value,
            value: 0.025,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "fade",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.ssaoMaterial.fade = value,
            onChangeCallback: (value: any) => ssaoEffect.ssaoMaterial.fade = value,
            value: 0.01,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "intensity",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.intensity = value,
            onChangeCallback: (value: any) => ssaoEffect.intensity = value,
            value: 1,
            min: 0,
            max: 100,
            step: 0.01
        },
        <ISliderElement>{
            name: "luminanceInfluence",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.luminanceInfluence = value,
            onChangeCallback: (value: any) => ssaoEffect.luminanceInfluence = value,
            value: 0.7,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "minRadiusScale",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.ssaoMaterial.minRadiusScale = value,
            onChangeCallback: (value: any) => ssaoEffect.ssaoMaterial.minRadiusScale = value,
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "radius",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.ssaoMaterial.radius = value,
            onChangeCallback: (value: any) => ssaoEffect.ssaoMaterial.radius = value,
            value: 0.1825,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "Rings",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.ssaoMaterial.rings = +value,
            onChangeCallback: (value: any) => ssaoEffect.ssaoMaterial.rings = +value,
            value: 7,
            min: 0,
            max: 100,
            step: 1
        },
        <ISliderElement>{
            name: "Samples",
            type: "slider",
            onInputCallback: (value: any) => ssaoEffect.ssaoMaterial.samples = +value,
            onChangeCallback: (value: any) => ssaoEffect.ssaoMaterial.samples = +value,
            value: 9,
            min: 0,
            max: 100,
            step: 1
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
