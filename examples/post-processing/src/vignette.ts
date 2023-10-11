import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    IVignetteEffectDefinition,
    POST_PROCESSING_EFFECT_TYPE,
    VignetteTechnique
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

    const vignetteEffectDefinition: IVignetteEffectDefinition = {
        properties: {
            /** The blend function of this effect. (default: BlendFunction.NORMAL) */
            blendFunction: BlendFunction.NORMAL,
            /** The Vignette darkness. (default: 0.5) */
            darkness: 0.5,
            /** The Vignette offset. (default: 0.5) */
            offset: 0.5,
            /** The Vignette technique. (default: VignetteTechnique.DEFAULT) */
            technique: VignetteTechnique.DEFAULT
        },
        type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
    }
    const vignetteEffectToken = viewport.postProcessing.addEffect(vignetteEffectDefinition);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                vignetteEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(vignetteEffectToken, vignetteEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(vignetteEffectDefinition.properties!.blendFunction!)
        },
        <ISliderElement>{
            name: "darkness",
            type: "slider",
            onChangeCallback: (value: number) => {
                vignetteEffectDefinition.properties!.darkness = value;
                viewport.postProcessing.updateEffect(vignetteEffectToken, vignetteEffectDefinition);
            },
            value: vignetteEffectDefinition.properties!.darkness,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "offset",
            type: "slider",
            onChangeCallback: (value: number) => {
                vignetteEffectDefinition.properties!.offset = value;
                viewport.postProcessing.updateEffect(vignetteEffectToken, vignetteEffectDefinition);
            },
            value: vignetteEffectDefinition.properties!.offset,
            min: 0,
            max: 1,
            step: 0.01
        },
        <IDropdownElement>{
            name: "VignetteTechnique",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                vignetteEffectDefinition.properties!.technique = Object.values(VignetteTechnique)[+value] as VignetteTechnique;
                viewport.postProcessing.updateEffect(vignetteEffectToken, vignetteEffectDefinition);
            },
            choices: Object.keys(VignetteTechnique),
            value: Object.values(VignetteTechnique).indexOf(vignetteEffectDefinition.properties!.technique!)
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
