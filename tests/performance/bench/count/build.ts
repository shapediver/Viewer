import {count, SCENE, type Viewer} from "./context";

export const label = "Full scene build (tree + viewport.update)";

export const run = (viewer: Viewer) =>
	count(
		viewer,
		"build",
		(options) => (window as any).__probe.build(options),
		SCENE,
	);
