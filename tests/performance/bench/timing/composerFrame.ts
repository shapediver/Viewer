import {cpuOf, median} from "../paired";
import {settle, type Viewer} from "./common";

/** Also the block count of the close-up metric (`aoFrame.ts`). */
export const SSAO_BLOCKS = 4;
const SSAO_FRAMES_PER_BLOCK = 4;

/**
 * SSAO camera frames drawn by the viewer. `wall` runs from the start of
 * `effectComposer.render` until a one-pixel `readPixels` returns, which
 * waits for the GPU. `gl.finish()` does not: on ANGLE with Direct3D 11 it
 * returns after about 2 ms. `cpu` is main-thread CPU time per frame.
 */
export async function ssaoBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate(async (count) => {
			const probe = (window as any).__probe;
			const gl: WebGL2RenderingContext = probe.gl;
			const composer = probe.viewport.postProcessing.effectComposer;
			if (!composer) return [];
			const pixel = new Uint8Array(4);
			const timings: number[] = [];
			const original = composer.render.bind(composer);
			composer.render = (...args: unknown[]) => {
				const start = performance.now();
				const result = original(...args);
				gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
				timings.push(performance.now() - start);
				return result;
			};
			const samples: number[] = [];
			for (let i = 0; i < count; i++) {
				timings.length = 0;
				probe.orbit(1);
				await new Promise((resolve) =>
					requestAnimationFrame(() => requestAnimationFrame(resolve)),
				);
				if (timings.length) samples.push(timings[0]);
			}
			composer.render = original;
			return samples;
		}, SSAO_FRAMES_PER_BLOCK),
	);
	await settle(viewer);
	return {cpu: cpu / SSAO_FRAMES_PER_BLOCK, wall: median(result)};
}
