import * as SDV from '@shapediver/viewer';
import {
    BlendFunction,
    createSession,
    createViewport,
    IGridEffectDefinition,
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

    const gridEffectDefinition: IGridEffectDefinition = {
        properties: {
            /** The blend function of this effect. (default: BlendFunction.MULTIPLY) */
            blendFunction: BlendFunction.MULTIPLY,
            /** The scale of the grid pattern. (default: 1.0) */
            scale: 1.0
        },
        type: POST_PROCESSING_EFFECT_TYPE.GRID,
    };
    const gridEffectToken = viewport.postProcessing.addEffect(gridEffectDefinition);

    createCustomUi([
        <IDropdownElement>{
            name: "BlendFunction",
            type: "dropdown",
            onChangeCallback: (value: string) => {
                gridEffectDefinition.properties!.blendFunction = Object.values(BlendFunction)[+value] as BlendFunction;
                viewport.postProcessing.updateEffect(gridEffectToken, gridEffectDefinition);
            },
            choices: Object.keys(BlendFunction),
            value: Object.values(BlendFunction).indexOf(gridEffectDefinition.properties!.blendFunction!)
        },
        <ISliderElement>{
            name: "scale",
            type: "slider",
            onChangeCallback: (value: number) => {
                gridEffectDefinition.properties!.scale = value;
                viewport.postProcessing.updateEffect(gridEffectToken, gridEffectDefinition);
            },
            value: gridEffectDefinition.properties!.scale,
            min: 0,
            max: 2,
            step: 0.001
        }
    ], document.getElementById("ui") as HTMLDivElement)
})();