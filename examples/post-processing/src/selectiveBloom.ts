import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    ISelectiveBloomEffectDefinition,
    KernelSize,
    POST_PROCESSING_EFFECT_TYPE,
    SelectiveBloomEffect
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

    const selectiveBloomEffectDefinition: ISelectiveBloomEffectDefinition = {
        type: POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
        properties: {
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
            /** Enables or disables if the background is evaluated for the bloom calculation. (default: true) */
            ignoreBackground: true
        }
    }
    const selectiveBloomEffectToken = viewport.postProcessing.addEffect(selectiveBloomEffectDefinition);
    viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                selectiveBloomEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(selectiveBloomEffectDefinition.properties!.blendFunction!)
        },
        <IBooleanElement>{
            name: "mipmapBlur",
            type: "boolean",
            onChangeCallback: (value: boolean) => {
                selectiveBloomEffectDefinition.properties!.mipmapBlur = value;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            value: selectiveBloomEffectDefinition.properties!.mipmapBlur
        },
        <IBooleanElement>{
            name: "ignoreBackground",
            type: "boolean",
            onChangeCallback: (value: any) => {
                selectiveBloomEffectDefinition.properties!.ignoreBackground = value;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            value: selectiveBloomEffectDefinition.properties!.ignoreBackground
        },
        <ISliderElement>{
            name: "intensity",
            type: "slider",
            onChangeCallback: (value: number) => {
                selectiveBloomEffectDefinition.properties!.intensity = value;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            value: selectiveBloomEffectDefinition.properties!.intensity,
            min: 0,
            max: 10,
            step: 0.01
        },
        <ISliderElement>{
            name: "luminanceSmoothing",
            type: "slider",
            onChangeCallback: (value: number) => {
                selectiveBloomEffectDefinition.properties!.luminanceSmoothing = value;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            value: selectiveBloomEffectDefinition.properties!.luminanceSmoothing,
            min: 0,
            max: 1,
            step: 0.001
        },
        <ISliderElement>{
            name: "luminanceThreshold",
            type: "slider",
            onChangeCallback: (value: number) => {
                selectiveBloomEffectDefinition.properties!.luminanceThreshold = value;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            value: selectiveBloomEffectDefinition.properties!.luminanceThreshold,
            min: 0,
            max: 1,
            step: 0.001
        },
        <IDropdownElement>{
            name: "blur - kernelSize",
            type: "dropdown",
            onChangeCallback: (value: number) => {
                selectiveBloomEffectDefinition.properties!.kernelSize = value;
                viewport.postProcessing.updateEffect(selectiveBloomEffectToken, selectiveBloomEffectDefinition);    
                viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);
            },
            choices: Object.keys(KernelSize),
            value: selectiveBloomEffectDefinition.properties!.kernelSize
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
