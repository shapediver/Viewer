// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE,
    OutlineEffect,
    BlendFunction,
    Resolution
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

    viewport.postProcessing.addEffect({
        type: POST_PROCESSING_EFFECT_TYPE.SMAA
    })

    const outlineEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.SCREEN) */
        blendFunction: BlendFunction.SCREEN,
        /** Whether the outline should be blurred. (default: false) */
        blur: false,
        /** The edge strength. (default: 1.0) */
        edgeStrength: 1,
        /** The color of hidden edges. (default: #22090a) */
        hiddenEdgeColor: "#22090a",
        /** The blur kernel size. (default: KernelSize.VERY_SMALL) */
        kernelSize: KernelSize.VERY_SMALL,
        /** The number of samples used for multisample antialiasing. Requires WebGL 2. (default: 0) */
        multisampling: 0,
        /** The pulse speed. A value of zero disables the pulse effect. (default: 0.0) */
        pulseSpeed: 0,
        type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
        /** The color of visible edges. (default: #ffffff) */
        visibleEdgeColor: "#ffffff",
        /** Whether occluded parts of selected objects should be visible. (default: true) */
        xRay: true,
    })
    const outlineEffect = <OutlineEffect>viewport.postProcessing.getEffect(outlineEffectToken);
    viewport.postProcessing.outlineEffects[outlineEffectToken].addSelection(session.node!);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => outlineEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => outlineEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(outlineEffect.blendMode.blendFunction)
        },
        <IBooleanElement>{
            name: "blur",
            type: "boolean",
            onInputCallback: (value: any) => outlineEffect.blur = value,
            onChangeCallback: (value: any) => outlineEffect.blur = value,
            value: false
        },
        <IBooleanElement>{
            name: "xRay",
            type: "boolean",
            onInputCallback: (value: any) => outlineEffect.xRay = value,
            onChangeCallback: (value: any) => outlineEffect.xRay = value,
            value: true
        },
        <ISliderElement>{
            name: "edgeStrength",
            type: "slider",
            onInputCallback: (value: any) => outlineEffect.edgeStrength = value,
            onChangeCallback: (value: any) => outlineEffect.edgeStrength = value,
            value: 1,
            min: 0,
            max: 100,
            step: 0.01
        },
        <ISliderElement>{
            name: "multisampling",
            type: "slider",
            onInputCallback: (value: any) => outlineEffect.multisampling = value,
            onChangeCallback: (value: any) => outlineEffect.multisampling = value,
            value: 0,
            min: 0,
            max: 10,
            step: 1
        },
        <ISliderElement>{
            name: "pulseSpeed",
            type: "slider",
            onInputCallback: (value: any) => outlineEffect.pulseSpeed = value,
            onChangeCallback: (value: any) => outlineEffect.pulseSpeed = value,
            value: 0,
            min: 0,
            max: 10,
            step: 0.01
        },
        <IColorElement>{
            name: "visibleEdgeColor",
            type: "color",
            onInputCallback: (value: any) => outlineEffect.visibleEdgeColor = new THREE.Color(value),
            onChangeCallback: (value: any) => outlineEffect.visibleEdgeColor = new THREE.Color(value),
            value: "#ffffff"
        },
        <IColorElement>{
            name: "hiddenEdgeColor",
            type: "color",
            onInputCallback: (value: any) => outlineEffect.hiddenEdgeColor = new THREE.Color(value),
            onChangeCallback: (value: any) => outlineEffect.hiddenEdgeColor = new THREE.Color(value),
            value: "#22090a"
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onInputCallback: (value: any) => outlineEffect.kernelSize = value,
            onChangeCallback: (value: any) => outlineEffect.kernelSize = value,
            choices: Object.keys(KernelSize),
            value: KernelSize.VERY_SMALL
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onInputCallback: (value: any) => outlineEffect.resolution.height = [Resolution.AUTO_SIZE, 240, 360, 480, 720, 1080][value],
            onChangeCallback: (value: any) => outlineEffect.resolution.height = [Resolution.AUTO_SIZE, 240, 360, 480, 720, 1080][value],
            choices: ["auto", "240", "360", "480", "720", "1080"],
            value: 0
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
