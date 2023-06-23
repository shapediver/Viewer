import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE
} from '@shapediver/viewer';
import {
    createCustomUi,
    IBooleanElement,
    IDropdownElement,
    ISliderElement
} from '@shapediver/viewer.utils.demo-helper';
import { IBloomEffectDefinition } from '@shapediver/viewer';

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

    const bloomEffectDefinition: IBloomEffectDefinition = {
        /** The blend function of this effect. (default: BlendFunction.ADD) */
        blendFunction: BlendFunction.ADD,
        /** The bloom intensity. (default: 1.0) */
        intensity: 1.0,
        /** The blur kernel size. (default: KernelSize.LARGE) */
        kernelSize: KernelSize.LARGE,
        /** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
        luminanceSmoothing: 0.025,
        /** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
        luminanceThreshold: 0.9,
        /** Enables or disables mipmap blur. (default: false) */
        mipmapBlur: false,
        type: POST_PROCESSING_EFFECT_TYPE.BLOOM,
    }
    const bloomEffectToken = viewport.postProcessing.addEffect(bloomEffectDefinition)

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                bloomEffectDefinition.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(bloomEffectToken, bloomEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(bloomEffectDefinition.blendFunction!)
        },
        <IBooleanElement>{
            name: "mipmapBlur",
            type: "boolean",
            onChangeCallback: (value: boolean) => {
                bloomEffectDefinition.mipmapBlur = value;
                viewport.postProcessing.updateEffect(bloomEffectToken, bloomEffectDefinition);
            },
            value: bloomEffectDefinition.mipmapBlur
        },
        <ISliderElement>{
            name: "intensity",
            type: "slider",
            onChangeCallback: (value: number) => {
                bloomEffectDefinition.intensity = value;
                viewport.postProcessing.updateEffect(bloomEffectToken, bloomEffectDefinition);
            },
            value: bloomEffectDefinition.intensity,
            min: 0,
            max: 10,
            step: 0.01
        },
        <ISliderElement>{
            name: "luminanceSmoothing",
            type: "slider",
            onChangeCallback: (value: number) => {
                bloomEffectDefinition.luminanceSmoothing = value;
                viewport.postProcessing.updateEffect(bloomEffectToken, bloomEffectDefinition);
            },
            value: bloomEffectDefinition.luminanceSmoothing,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "luminanceThreshold",
            type: "slider",
            onChangeCallback: (value: number) => {
                bloomEffectDefinition.luminanceThreshold = value;
                viewport.postProcessing.updateEffect(bloomEffectToken, bloomEffectDefinition);
            },
            value: bloomEffectDefinition.luminanceThreshold,
            min: 0,
            max: 1,
            step: 0.001
        },
        <IDropdownElement>{
            name: "blur - kernelSize",
            type: "dropdown",
            onChangeCallback: (value: number) => {
                bloomEffectDefinition.kernelSize = value;
                viewport.postProcessing.updateEffect(bloomEffectToken, bloomEffectDefinition);
            },
            choices: Object.keys(KernelSize),
            value: bloomEffectDefinition.kernelSize
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
