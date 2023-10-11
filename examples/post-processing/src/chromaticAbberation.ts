import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    POST_PROCESSING_EFFECT_TYPE
} from '@shapediver/viewer';
import {
    createCustomUi,
    IBooleanElement,
    IDropdownElement,
    ISliderElement
} from '@shapediver/viewer.shared.demo-helper';
import { vec2 } from 'gl-matrix';

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

    const chromaticAberrationEffectDefinition: SDV.IChromaticAberrationEffectDefinition = {
        properties: {
            /** The blend function of this effect. (default: BlendFunction.NORMAL) */
            blendFunction: BlendFunction.NORMAL,
            /** The modulation offset. Only applies if `radialModulation` is enabled. (default: 0.15) */
            modulationOffset: 0.15,
            /** The color offset. (default: [0.001, 0.0005]) */
            offset: [0.001, 0.0005],
            /** Whether the effect should be modulated with a radial gradient. (default: false) */
            radialModulation: false
        },
        type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION
    }
    const chromaticAberrationEffectToken = viewport.postProcessing.addEffect(chromaticAberrationEffectDefinition)

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                chromaticAberrationEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(chromaticAberrationEffectToken, chromaticAberrationEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(chromaticAberrationEffectDefinition.properties!.blendFunction!)
        },
        <IBooleanElement>{
            name: "radialModulation",
            type: "boolean",
            onChangeCallback: (value: boolean) => {
                chromaticAberrationEffectDefinition.properties!.radialModulation = value;
                viewport.postProcessing.updateEffect(chromaticAberrationEffectToken, chromaticAberrationEffectDefinition);
            },
            value: chromaticAberrationEffectDefinition.properties!.radialModulation
        },
        <ISliderElement>{
            name: "offset - x",
            type: "slider",
            onChangeCallback: (value: number) => {
                (<vec2>chromaticAberrationEffectDefinition.properties!.offset) = [value, (<vec2>(<vec2>chromaticAberrationEffectDefinition.properties!.offset))![1]];
                viewport.postProcessing.updateEffect(chromaticAberrationEffectToken, chromaticAberrationEffectDefinition);
            },
            value: (<vec2>chromaticAberrationEffectDefinition.properties!.offset)![0],
            min: 0,
            max: 1,
            step: 0.0001
        },
        <ISliderElement>{
            name: "offset - y",
            type: "slider",
            onChangeCallback: (value: number) => {
                (<vec2>chromaticAberrationEffectDefinition.properties!.offset) = [(<vec2>chromaticAberrationEffectDefinition.properties!.offset)![0], value];
                viewport.postProcessing.updateEffect(chromaticAberrationEffectToken, chromaticAberrationEffectDefinition);
            },
            value: (<vec2>chromaticAberrationEffectDefinition.properties!.offset)![1],
            min: 0,
            max: 1,
            step: 0.0001
        },
        <ISliderElement>{
            name: "modulationOffset",
            type: "slider",
            onChangeCallback: (value: number) => {
                chromaticAberrationEffectDefinition.properties!.modulationOffset = value;
                viewport.postProcessing.updateEffect(chromaticAberrationEffectToken, chromaticAberrationEffectDefinition);
            },
            value: chromaticAberrationEffectDefinition.properties!.modulationOffset,
            min: 0,
            max: 1,
            step: 0.0001
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
