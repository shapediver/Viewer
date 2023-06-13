// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    SMAAEffect,
    EdgeDetectionMode,
    PredicationMode,
    SMAAPreset
} from "@shapediver/viewer";

import * as SDV from "@shapediver/viewer"
import { createCustomUi, IDropdownElement } from "@shapediver/viewer.utils.demo-helper";
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

    const smaaEffectToken = viewport.postProcessing.addEffect({
        /** The edge detection mode. (default: EdgeDetectionMode.COLOR) */
        edgeDetectionMode: EdgeDetectionMode.COLOR,
        /** The predication mode. (default: PredicationMode.DISABLED) */
        predicationMode: PredicationMode.DISABLED,
        /** The quality preset. (default: SMAAPreset.MEDIUM) */
        preset: SMAAPreset.MEDIUM,
        type: POST_PROCESSING_EFFECT_TYPE.SMAA,
    })
    const smaaEffect = <SMAAEffect>viewport.postProcessing.getEffect(smaaEffectToken);

    createCustomUi([
        <IDropdownElement>{
            name: "edgeDetectionMode",
            type: "dropdown",
            onInputCallback: (value: any) => smaaEffect.edgeDetectionMaterial.edgeDetectionMode = Object.values(EdgeDetectionMode)[+value] as EdgeDetectionMode,
            onChangeCallback: (value: any) => smaaEffect.edgeDetectionMaterial.edgeDetectionMode = Object.values(EdgeDetectionMode)[+value] as EdgeDetectionMode,
            choices: Object.keys(EdgeDetectionMode),
            value: Object.values(EdgeDetectionMode).indexOf(smaaEffect.edgeDetectionMaterial.edgeDetectionMode)
        },
        <IDropdownElement>{
            name: "predicationMode",
            type: "dropdown",
            onInputCallback: (value: any) => smaaEffect.edgeDetectionMaterial.predicationMode = Object.values(PredicationMode)[+value] as PredicationMode,
            onChangeCallback: (value: any) => smaaEffect.edgeDetectionMaterial.predicationMode = Object.values(PredicationMode)[+value] as PredicationMode,
            choices: Object.keys(PredicationMode),
            value: Object.values(PredicationMode).indexOf(smaaEffect.edgeDetectionMaterial.predicationMode)
        },
        <IDropdownElement>{
            name: "preset",
            type: "dropdown",
            onInputCallback: (value: any) => smaaEffect.applyPreset(Object.values(SMAAPreset)[+value] as SMAAPreset),
            onChangeCallback: (value: any) => smaaEffect.applyPreset(Object.values(SMAAPreset)[+value] as SMAAPreset),
            choices: Object.keys(SMAAPreset),
            value: Object.values(SMAAPreset).indexOf(SMAAPreset.MEDIUM)
        },
    ], document.getElementById("ui") as HTMLDivElement)
})();
