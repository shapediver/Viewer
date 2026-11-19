import {cpuOf, median} from "../paired";
import {settle, type Viewer} from "./common";

export const VERSION_BLOCKS = 8;
const VERSION_UPDATES_PER_BLOCK = 2;

/**
 * `updateVersion()` on the fixture root, as adding a session does. No scene
 * update follows, so the blocks only re-version the tree. Measured just before the close-up:
 * the next scene update would convert the whole fixture again.
 */
export async function versionBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate((count) => {
			const root = (window as any).__probe.aec.root;
			const samples: number[] = [];
			for (let i = 0; i < count; i++) {
				const start = performance.now();
				root.updateVersion();
				samples.push(performance.now() - start);
			}
			return samples;
		}, VERSION_UPDATES_PER_BLOCK),
	);
	await settle(viewer);
	return {cpu: cpu / VERSION_UPDATES_PER_BLOCK, wall: median(result)};
}
