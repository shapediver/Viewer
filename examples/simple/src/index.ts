import * as SDV from '@shapediver/viewer';
import {
    createSession,
    createViewport,
    IHBAOEffectDefinition,
    POST_PROCESSING_EFFECT_TYPE
} from '@shapediver/viewer';
import {
    createCustomUi,
    IColorElement,
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

    const hbaoEffectDefinition: IHBAOEffectDefinition = {
        properties: {
            /** The resolution scale of the ambient occlusion. (default: 1) */
            resolutionScale: 1,
            /** The samples that are taken per pixel to compute the ambient occlusion. (default: 8) */
            spp: 8,
            /** Controls the radius/size of the ambient occlusion in world units. (default: 1) */
            distance: 1,
            /** Controls how fast the ambient occlusion fades away with distance in world units. (default: 1) */
            distanceIntensity: 1,
            /** A purely artistic control for the intensity of the AO - runs the ao through the function pow(ao, intensity), which has the effect of darkening areas with more ambient occlusion. (default: 2.5) */
            intensity: 2.5,
            /** The color of the ambient occlusion. (default: black) */
            color: "#000000",
            /** The bias that is used for the effect in world units. (default: 10) */
            bias: 10,
            /** The thickness if the ambient occlusion effect. (default: 0.5) */
            thickness: 0.5,

            /** The number of iterations of the denoising pass. (default: 1) */
            iterations: 1,
            /** The radius of the poisson disk. (default: 15) */
            radius: 15,
            /** The rings of the poisson disk. (default: 4) */
            rings: 4,
            /** Allows to adjust the influence of the luma difference in the denoising pass. (default: 10) */
            lumaPhi: 10,
            /** Allows to adjust the influence of the depth difference in the denoising pass. (default: 2) */
            depthPhi: 2,
            /** Allows to adjust the influence of the normal difference in the denoising pass. (default: 3.25) */
            normalPhi: 3.25,
            /** The samples that are used in the poisson disk. (default: 16) */
            samples: 16
        },
        type: POST_PROCESSING_EFFECT_TYPE.HBAO
    };
    const hbaoEffectToken = viewport.postProcessing.addEffect(hbaoEffectDefinition)

    createCustomUi([

        <ISliderElement>{
            name: "resolutionScale",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.resolutionScale = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.resolutionScale,
            min: 0.1,
            max: 1,
            step: 0.1
        },
        <ISliderElement>{
            name: "spp",
            type: "slider",
            onChangeCallback: (value: number) => {
                console.log(typeof value)
                hbaoEffectDefinition.properties!.spp = +value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.spp,
            min: 1,
            max: 64,
            step: 1
        },
        <ISliderElement>{
            name: "distance",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.distance = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.distance,
            min: 0.1,
            max: 10,
            step: 0.001
        },
        <ISliderElement>{
            name: "distanceIntensity",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.distanceIntensity = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.distanceIntensity,
            min: 0,
            max: 2,
            step: 0.001
        },
        <ISliderElement>{
            name: "intensity",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.intensity = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.intensity,
            min: 0,
            max: 32,
            step: 0.001
        },
        <ISliderElement>{
            name: "bias",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.bias = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.bias,
            min: 0,
            max: 100,
            step: 0.001
        },
        <ISliderElement>{
            name: "thickness",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.thickness = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.thickness,
            min: 0,
            max: 1,
            step: 0.001
        },
        <IColorElement>{
            name: "color",
            type: "color",
            onChangeCallback: (value: string) => {
                hbaoEffectDefinition.properties!.color = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.color
        },
        <ISliderElement>{
            name: "iterations",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.iterations = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.iterations,
            min: 0,
            max: 3,
            step: 1
        },
        <ISliderElement>{
            name: "radius",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.radius = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.radius,
            min: 0,
            max: 32,
            step: 0.001
        },
        <ISliderElement>{
            name: "rings",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.rings = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.rings,
            min: 0,
            max: 16,
            step: 1
        },
        <ISliderElement>{
            name: "lumaPhi",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.lumaPhi = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.lumaPhi,
            min: 0,
            max: 20,
            step: 0.001
        },

        <ISliderElement>{
            name: "depthPhi",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.depthPhi = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.depthPhi,
            min: 0,
            max: 20,
            step: 0.001
        },

        <ISliderElement>{
            name: "normalPhi",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.normalPhi = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.normalPhi,
            min: 0,
            max: 50,
            step: 0.001
        },

        <ISliderElement>{
            name: "samples",
            type: "slider",
            onChangeCallback: (value: number) => {
                hbaoEffectDefinition.properties!.samples = value;
                viewport.postProcessing.updateEffect(hbaoEffectToken, hbaoEffectDefinition);
            },
            value: hbaoEffectDefinition.properties!.samples,
            min: 0,
            max: 32,
            step: 1
        },

    ], document.getElementById("ui") as HTMLDivElement)
})();
