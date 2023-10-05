import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    ITiltShiftEffectDefinition,
    KernelSize,
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
    
    const tiltShiftEffectDefinition: ITiltShiftEffectDefinition = {
        properties: {
            /** The blend function of this effect. (default: BlendFunction.NORMAL) */
            blendFunction: BlendFunction.NORMAL,
            /** The softness of the focus area edges. (default: 0.3) */
            feather: 0.3,
            /** The relative size of the focus area. (default: 0.4) */
            focusArea: 0.4,
            /** The blur kernel size. (default: KernelSize.MEDIUM) */
            kernelSize: KernelSize.MEDIUM,
            /** The relative offset of the focus area. (default: 0.0) */
            offset: 0,
            /** The rotation of the focus area in radians. (default: 0.0) */
            rotation: 0
        },
        type: POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,
    };
    const tiltShiftEffectToken = viewport.postProcessing.addEffect(tiltShiftEffectDefinition)

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                tiltShiftEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(tiltShiftEffectToken, tiltShiftEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(tiltShiftEffectDefinition.properties!.blendFunction!)
        },
        <ISliderElement>{
            name: "feather",
            type: "slider",
            onChangeCallback: (value: number) => {
                tiltShiftEffectDefinition.properties!.feather = value;
                viewport.postProcessing.updateEffect(tiltShiftEffectToken, tiltShiftEffectDefinition);
            },
            value: tiltShiftEffectDefinition.properties!.feather,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "focusArea",
            type: "slider",
            onChangeCallback: (value: number) => {
                tiltShiftEffectDefinition.properties!.focusArea = value;
                viewport.postProcessing.updateEffect(tiltShiftEffectToken, tiltShiftEffectDefinition);
            },
            value: tiltShiftEffectDefinition.properties!.focusArea,
            min: 0,
            max: 10,
            step: 0.01
        },
        <ISliderElement>{
            name: "offset",
            type: "slider",
            onChangeCallback: (value: number) => {
                tiltShiftEffectDefinition.properties!.offset = value;
                viewport.postProcessing.updateEffect(tiltShiftEffectToken, tiltShiftEffectDefinition);
            },
            value: tiltShiftEffectDefinition.properties!.offset,
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            name: "rotation",
            type: "slider",
            onChangeCallback: (value: number) => {
                tiltShiftEffectDefinition.properties!.rotation = value;
                viewport.postProcessing.updateEffect(tiltShiftEffectToken, tiltShiftEffectDefinition);
            },
            value: tiltShiftEffectDefinition.properties!.rotation,
            min: 0,
            max: Math.PI,
            step: 0.01
        },
        <IDropdownElement>{
            name: "kernelSize",
            type: "dropdown",
            onChangeCallback: (value: number) => {
                tiltShiftEffectDefinition.properties!.kernelSize = value;
                viewport.postProcessing.updateEffect(tiltShiftEffectToken, tiltShiftEffectDefinition);
            },
            choices: Object.keys(KernelSize),
            value: tiltShiftEffectDefinition.properties!.kernelSize
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();
