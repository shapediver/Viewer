import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    ISSAOEffectDefinition,
    POST_PROCESSING_EFFECT_TYPE
    } from '@shapediver/viewer';
import {
    createCustomUi,
    IBooleanElement,
    IColorElement,
    IDropdownElement,
    ISliderElement
    } from '@shapediver/viewer.utils.demo-helper';

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
    
    const ssaoEffectDefinition: ISSAOEffectDefinition = {
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
    };
    const ssaoEffectToken = viewport.postProcessing.addEffect(ssaoEffectDefinition)

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                ssaoEffectDefinition.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(ssaoEffectDefinition.blendFunction!)
        },
        <IColorElement>{
            name: "color",
            type: "color",
            onChangeCallback: (value: string) => {
                ssaoEffectDefinition.color = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.color
        },
        <IBooleanElement>{
            name: "depthAwareUpsampling",
            type: "boolean",
            onChangeCallback: (value: boolean) => {
                ssaoEffectDefinition.depthAwareUpsampling = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.depthAwareUpsampling
        },
        <ISliderElement>{
            name: "bias",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.bias = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.bias,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "fade",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.fade = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.fade,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "intensity",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.intensity = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.intensity,
            min: 0,
            max: 100,
            step: 0.01
        },
        <ISliderElement>{
            name: "luminanceInfluence",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.luminanceInfluence = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.luminanceInfluence,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "minRadiusScale",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.minRadiusScale = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.minRadiusScale,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "radius",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.radius = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.radius,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "Rings",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.rings = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.rings,
            min: 0,
            max: 100,
            step: 1
        },
        <ISliderElement>{
            name: "Samples",
            type: "slider",
            onChangeCallback: (value: number) => {
                ssaoEffectDefinition.samples = value;
                viewport.postProcessing.updateEffect(ssaoEffectToken, ssaoEffectDefinition);
            },
            value: ssaoEffectDefinition.samples,
            min: 0,
            max: 100,
            step: 1
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
