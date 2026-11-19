import {cpuOf} from "../paired";
import {settle, VARIANT, type Viewer} from "./common";

export async function firstFrame(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate(async (variant) => {
			const probe = (window as any).__probe;
			probe.show(variant);
			while (!probe.frames().length)
				await new Promise((resolve) => requestAnimationFrame(resolve));
			return probe
				.frames()[0]
				.passes.reduce((sum: number, pass: any) => sum + pass.ms, 0);
		}, VARIANT),
	);
	await settle(viewer);
	return {cpu, wall: result as number};
}
