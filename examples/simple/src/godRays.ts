// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE,
    GodRaysEffect,
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

    const godRaysEffectToken = viewport.postProcessing.addEffect({
        /** The blend function of this effect. (default: BlendFunction.SCREEN) */
        blendFunction: BlendFunction.SCREEN,
        /** Whether the god rays should be blurred to reduce artifacts. (default: true) */
        blur: true,
        /** An upper bound for the saturation of the overall effect. (default: 1.0) */
        clampMax: 1.0,
        /** An illumination decay factor. (default: 0.9) */
        decay: 0.9,
        /** The density of the light rays. (default: 0.96) */
        density: 0.96,
        /** A constant attenuation coefficient. (default: 0.6) */
        exposure: 0.6,
        /** The blur kernel size. Has no effect if blur is disabled. (default: KernelSize.SMALL) */
        kernelSize: KernelSize.SMALL,
        type: POST_PROCESSING_EFFECT_TYPE.GOD_RAYS,
        /** A light ray weight factor. (default: 0.4) */
        weight: 0.4
    })
    const godRaysEffect = <GodRaysEffect>viewport.postProcessing.getEffect(godRaysEffectToken);

    const output = session.getOutputByName("HorizontalBottom").find(o => !o.format.includes("material"))!;
    viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)    

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onInputCallback: (value: any) => godRaysEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            onChangeCallback: (value: any) => godRaysEffect.blendMode.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction,
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(godRaysEffect.blendMode.blendFunction)
        },
        <IBooleanElement>{
            name: "blur",
            type: "boolean",
            onInputCallback: (value: any) => godRaysEffect.blur = value,
            onChangeCallback: (value: any) => godRaysEffect.blur = value,
            value: true
        },
        <ISliderElement>{
            name: "density",
            type: "slider",
            onInputCallback: (value: any) => godRaysEffect.godRaysMaterial.density = value,
            onChangeCallback: (value: any) => godRaysEffect.godRaysMaterial.density = value,
            value: 0.96,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "decay",
            type: "slider",
            onInputCallback: (value: any) => godRaysEffect.godRaysMaterial.decay = value,
            onChangeCallback: (value: any) => godRaysEffect.godRaysMaterial.decay = value,
            value: 0.9,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "weight",
            type: "slider",
            onInputCallback: (value: any) => godRaysEffect.godRaysMaterial.weight = value,
            onChangeCallback: (value: any) => godRaysEffect.godRaysMaterial.weight = value,
            value: 0.4,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "exposure",
            type: "slider",
            onInputCallback: (value: any) => godRaysEffect.godRaysMaterial.exposure = value,
            onChangeCallback: (value: any) => godRaysEffect.godRaysMaterial.exposure = value,
            value: 0.6,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "clampMax",
            type: "slider",
            onInputCallback: (value: any) => godRaysEffect.godRaysMaterial.uniforms.clampMax.value = value,
            onChangeCallback: (value: any) => godRaysEffect.godRaysMaterial.uniforms.clampMax.value = value,
            value: 1,
            min: 0,
            max: 1,
            step: 0.001
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onInputCallback: (value: any) => godRaysEffect.kernelSize = value,
            onChangeCallback: (value: any) => godRaysEffect.kernelSize = value,
            choices: Object.keys(KernelSize),
            value: KernelSize.SMALL
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();