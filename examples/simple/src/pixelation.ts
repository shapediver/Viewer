// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE,
    PixelationEffect
} from "@shapediver/viewer";

import * as SDV from "@shapediver/viewer"
import { createCustomUi, ISliderElement } from "@shapediver/viewer.utils.demo-helper";
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

    const pixelationEffectToken = viewport.postProcessing.addEffect({
        /** The pixel granularity. (default: 30.0) */
        granularity: 30.0,
        type: POST_PROCESSING_EFFECT_TYPE.PIXELATION
    })
    const pixelationEffect = <PixelationEffect>viewport.postProcessing.getEffect(pixelationEffectToken);

    createCustomUi([
        <ISliderElement>{
            name: "granularity",
            type: "slider",
            onInputCallback: (value: any) => pixelationEffect.granularity = value,
            onChangeCallback: (value: any) => pixelationEffect.granularity = value,
            value: 30,
            min: 0,
            max: 100,
            step: 0.01
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
