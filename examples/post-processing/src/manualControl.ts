import * as SDV from "@shapediver/viewer";
import {createSession, createViewport} from "@shapediver/viewer";
import {EffectPass, PixelationEffect, RenderPass} from "postprocessing";

(<any>window).SDV = SDV;

(async () => {
	// create a viewport
	const viewport = await createViewport({
		canvas: document.getElementById("canvas") as HTMLCanvasElement,
		id: "myViewport",
	});
	// create a session
	const session = await createSession({
		ticket: "95aa45115f2bfa0e9501127bf9c9f392c977792e44c62c6b2a5575133426c4066ead20626932b8c199eec88594bbc03a80854a6d06f3db775880a00df465c8bd3e53dd290464b51c69f4afad03e8bbe80f0a70b7dc9896a43ca4c75eaa97dc11713e1bacd650d1-6c09ff8204f1fce099cde4b86dd74ba5",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		id: "mySession",
	});

	// activate the manual post-processing
	viewport.postProcessing.manualPostProcessing = true;

	// get all the necessary objects from the API
	const composer = viewport.postProcessing.effectComposer!;
	const scene = viewport.threeJsCoreObjects.scene;
	const camera = viewport.threeJsCoreObjects.camera;

	// add passes and effects
	composer.addPass(new RenderPass(scene, camera));
	const pixelationEffect = new PixelationEffect();
	composer.addPass(new EffectPass(camera, pixelationEffect));
})();
