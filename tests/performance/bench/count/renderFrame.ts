import {count, VARIANT, type Viewer} from "./context";

const RENDERS = 2;

export const label = `Camera frame, renderer.render x${RENDERS}`;

export async function run(viewer: Viewer) {
	await viewer.page.evaluate(
		(variant) => (window as any).__probe.show(variant),
		VARIANT,
	);
	return count(
		viewer,
		"renderFrame",
		(renders) => {
			const probe = (window as any).__probe;
			const camera = probe.viewport.threeJsCoreObjects.camera;
			for (let i = 0; i < renders; i++)
				probe.renderer.render(probe.scene, camera);
		},
		RENDERS,
		true,
	);
}
