import {cpuOf, median} from "../paired";
import type {Viewer} from "./common";

export const RENDER_BLOCKS = 12;
const RENDERS_PER_BLOCK = 2;

/**
 * `renderer.render` of the viewport scene, called directly. The camera does
 * not move, so the viewer does not draw on its own afterwards.
 */
export async function renderBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate((count) => {
			const probe = (window as any).__probe;
			const camera = probe.viewport.threeJsCoreObjects.camera;
			const samples: number[] = [];
			for (let i = 0; i < count; i++) {
				const start = performance.now();
				probe.renderer.render(probe.scene, camera);
				samples.push(performance.now() - start);
			}
			return samples;
		}, RENDERS_PER_BLOCK),
	);
	return {cpu: cpu / RENDERS_PER_BLOCK, wall: median(result)};
}
