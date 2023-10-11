import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE
} from '@shapediver/viewer';
import { createCustomUi, IDropdownElement, ISliderElement } from '@shapediver/viewer.shared.demo-helper';

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
            "95aa45115f2bfa0e9501127bf9c9f392c977792e44c62c6b2a5575133426c4066ead20626932b8c199eec88594bbc03a80854a6d06f3db775880a00df465c8bd3e53dd290464b51c69f4afad03e8bbe80f0a70b7dc9896a43ca4c75eaa97dc11713e1bacd650d1-6c09ff8204f1fce099cde4b86dd74ba5",
        modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
        id: "mySession"
    });

    const depthOfFieldEffectDefinition: SDV.IDepthOfFieldEffectDefinition = {
        properties: {
            /** The blend function of this effect. (default: BlendFunction.NORMAL) */
            blendFunction: BlendFunction.NORMAL,
            /** The scale of the bokeh blur. (default: 5.0) */
            bokehScale: 5.0,
            /** The normalized focus distance. Range is [0.0, 1.0]. (default: 0.0) */
            focusDistance: 0.0,
            /** The focus range. Range is [0.0, 1.0]. (default: 0.01) */
            focusRange: 0.01
        },
        type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD
    }

    const depthOfFieldEffectToken = viewport.postProcessing.addEffect(depthOfFieldEffectDefinition)

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                depthOfFieldEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(depthOfFieldEffectToken, depthOfFieldEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(depthOfFieldEffectDefinition.properties!.blendFunction!)
        },
        <ISliderElement>{
            name: "bokehScale",
            type: "slider",
            onChangeCallback: (value: number) => {
                depthOfFieldEffectDefinition.properties!.bokehScale = value;
                viewport.postProcessing.updateEffect(depthOfFieldEffectToken, depthOfFieldEffectDefinition);
            },
            value: depthOfFieldEffectDefinition.properties!.bokehScale,
            min: 0,
            max: 10,
            step: 0.01
        },
        <ISliderElement>{
            name: "focusDistance",
            type: "slider",
            onChangeCallback: (value: number) => {
                depthOfFieldEffectDefinition.properties!.focusDistance = value;
                viewport.postProcessing.updateEffect(depthOfFieldEffectToken, depthOfFieldEffectDefinition);
            },
            value: depthOfFieldEffectDefinition.properties!.focusDistance,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "focusRange",
            type: "slider",
            onChangeCallback: (value: number) => {
                depthOfFieldEffectDefinition.properties!.focusRange = value;
                viewport.postProcessing.updateEffect(depthOfFieldEffectToken, depthOfFieldEffectDefinition);
            },
            value: depthOfFieldEffectDefinition.properties!.focusRange,
            min: 0,
            max: 1,
            step: 0.001
        },
    ], document.getElementById("ui") as HTMLDivElement)
})();
