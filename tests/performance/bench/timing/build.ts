import {cpuOf} from "../paired";
import {SCENE, type Viewer} from "./common";

export async function build(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate(
			(options) => (window as any).__probe.build(options).total,
			SCENE,
		),
	);
	return {cpu, wall: result as number};
}
