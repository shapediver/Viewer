import {cpuOf, median} from "../paired";
import {settle, type Viewer} from "./common";

export const UPDATE_BLOCKS = 8;
/** Even, so every block leaves the scene as it found it. */
const UPDATES_PER_BLOCK = 4;

export async function updateBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate((count) => {
			const probe = (window as any).__probe;
			const samples: number[] = [];
			for (let i = 0; i < count; i++)
				samples.push(probe.timeOneNodeChange());
			return samples;
		}, UPDATES_PER_BLOCK),
	);
	await settle(viewer);
	return {cpu: cpu / UPDATES_PER_BLOCK, wall: median(result)};
}
