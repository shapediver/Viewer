import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    GodRaysEffect,
    IGodRaysEffectDefinition,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE
} from '@shapediver/viewer';
import {
    createCustomUi,
    IBooleanElement,
    IDropdownElement,
    ISliderElement
} from '@shapediver/viewer.shared.demo-helper';

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

    const godRaysEffectDefinition: IGodRaysEffectDefinition = {
        properties: {
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
            /** A light ray weight factor. (default: 0.4) */
            weight: 0.4
        },
        type: POST_PROCESSING_EFFECT_TYPE.GOD_RAYS,
    };
    const godRaysEffectToken = viewport.postProcessing.addEffect(godRaysEffectDefinition)

    const output = session.getOutputByName("HorizontalBottom").find(o => !o.format.includes("material"))!;
    viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                godRaysEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(godRaysEffectDefinition.properties!.blendFunction!)
        },
        <IBooleanElement>{
            name: "blur",
            type: "boolean",
            onChangeCallback: (value: boolean) => {
                godRaysEffectDefinition.properties!.blur = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            value: godRaysEffectDefinition.properties!.blur
        },
        <ISliderElement>{
            name: "density",
            type: "slider",
            onChangeCallback: (value: number) => {
                godRaysEffectDefinition.properties!.density = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            value: godRaysEffectDefinition.properties!.density,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "decay",
            type: "slider",
            onChangeCallback: (value: number) => {
                godRaysEffectDefinition.properties!.decay = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            value: godRaysEffectDefinition.properties!.decay,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "weight",
            type: "slider",
            onChangeCallback: (value: number) => {
                godRaysEffectDefinition.properties!.weight = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            value: godRaysEffectDefinition.properties!.weight,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "exposure",
            type: "slider",
            onChangeCallback: (value: number) => {
                godRaysEffectDefinition.properties!.exposure = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            value: godRaysEffectDefinition.properties!.exposure,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "clampMax",
            type: "slider",
            onChangeCallback: (value: number) => {
                godRaysEffectDefinition.properties!.clampMax = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            value: godRaysEffectDefinition.properties!.clampMax,
            min: 0,
            max: 1,
            step: 0.001
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onChangeCallback: (value: number) => {
                godRaysEffectDefinition.properties!.kernelSize = value;
                viewport.postProcessing.updateEffect(godRaysEffectToken, godRaysEffectDefinition);
                viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(output.node!)
            },
            choices: Object.keys(KernelSize),
            value: godRaysEffectDefinition.properties!.kernelSize
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();