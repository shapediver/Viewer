import * as SDV from '@shapediver/viewer';
import {
    createSession,
    createViewport
} from '@shapediver/viewer';
import { EffectPass, RenderPass } from 'postprocessing';
import { Uniform, Vector3 } from "three";
import { BlendFunction, Effect } from "postprocessing";

(<any>window).SDV = SDV;

const fragmentShader = `
uniform vec3 weights;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	outputColor = vec4(inputColor.rgb * weights, inputColor.a);
}
`;

export class CustomEffect extends Effect {
    // #region Constructors (1)

    constructor() {
        super("CustomEffect", fragmentShader, {
            blendFunction: BlendFunction.NORMAL,
            uniforms: new Map([
                ["weights", new Uniform(new Vector3())]
            ])
        });
    }

    // #endregion Constructors (1)
}

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

    // activate the manual post-processing
    viewport.postProcessing.manualPostProcessing = true;

    // get all the necessary objects from the API
    const composer = viewport.postProcessing.effectComposer!;
    const scene = viewport.threeJsCoreObjects.scene;
    const camera = viewport.threeJsCoreObjects.camera;

    // add passes and effects
    composer.addPass(new RenderPass(scene, camera));

    // create a simple custom effect and change the uniform
    const customEffect = new CustomEffect();
    customEffect.uniforms.set("weights", new Uniform(new Vector3(1, 0, 0)))

    composer.addPass(new EffectPass(camera, customEffect));
})();
