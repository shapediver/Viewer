import {count, type Viewer} from "./context";

const SSAO_FRAMES = 2;

export const label = `Camera frame with SSAO, post-processing render x${SSAO_FRAMES}`;

export async function run(viewer: Viewer) {
	await viewer.page.evaluate(() => (window as any).__probe.addSsao());
	return count(
		viewer,
		"ssaoFrame",
		(frames) => {
			const probe = (window as any).__probe;
			const composer = probe.viewport.postProcessing.effectComposer;
			const renderer = probe.renderer;
			const camera = probe.viewport.threeJsCoreObjects.camera;
			if (!composer)
				throw new Error("SSAO did not create an effect composer");
			// What PostProcessingManager.render does around the composer,
			// without the clear colour (only visible in the image).
			const toneMapping = renderer.toneMapping;
			renderer.toneMapping = 0; // THREE.NoToneMapping
			renderer.autoClear = false;
			composer.setMainCamera(camera);
			for (let i = 0; i < frames; i++) composer.render();
			renderer.toneMapping = toneMapping;
			renderer.autoClear = true;
		},
		SSAO_FRAMES,
		true,
	);
}
