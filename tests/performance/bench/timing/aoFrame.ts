import {AEC_DEFAULT} from "../../fixtures/aecScene";
import {settle, type Viewer} from "./common";

/**
 * The facade seen from far away is CPU-bound: thousands of draw calls set
 * the frame time and a change in the full-screen passes does not show. Close
 * to one facade at 1920x1080 the frustum drops most meshes, but about 2,900
 * scene draw calls were still left. So everything outside the three middle
 * floors and the facade in front of the camera is hidden (about 270 draw
 * calls in the colour and normal passes). The frame is then the passes that
 * run per pixel: ambient occlusion, denoise, anti-aliasing, tone mapping.
 * Shadows are off, so the lighting does not add to them.
 *
 * This is the last metric of a round, so changing the scene is safe. Its
 * frames are measured with `ssaoBlock` (`composerFrame.ts`).
 */
const CLOSE_UP_VIEWPORT = {width: 1920, height: 1080};
const CLOSE_UP_DISTANCE = 9;

export async function closeUp(viewer: Viewer) {
	await viewer.page.setViewportSize(CLOSE_UP_VIEWPORT);
	await viewer.page.evaluate(
		([options, distance]) => {
			const probe = (window as any).__probe;
			const keep = Math.floor(options.floors / 2);
			probe.aec.root.traverse((node: any) => {
				const floor = /^floor(\d+)$/.exec(node.name);
				if (floor && Math.abs(Number(floor[1]) - keep) > 1)
					node.visible = false;
				if (/^facade[123]$/.test(node.name)) node.visible = false;
			});
			probe.viewport.shadows = false;
			probe.viewport.softShadows = false;
			probe.aec.root.updateVersion();
			probe.viewport.update();
			const camera = probe.viewport.camera;
			const side = options.baysPerSide * options.bayWidth;
			const height = options.floors * options.floorHeight;
			camera.position = [0, -side / 2 - distance, height / 2];
			camera.target = [0, -side / 2, height / 2];
		},
		[AEC_DEFAULT, CLOSE_UP_DISTANCE] as const,
	);
	await settle(viewer);
}
