import {count, type Viewer} from "./context";
import {setupPick} from "./pickSetup";

const PICKS = 20;

export const label = `Pointer pick on nothing, still scene x${PICKS}`;

export async function run(viewer: Viewer) {
	await setupPick(viewer);
	return count(
		viewer,
		"pickMiss",
		(picks) => {
			const engine = (window as any).__pickEngine;
			const event = (window as any).__pickEvent;
			const [x, y] = (window as any).__pickPoints.miss;
			for (let i = 0; i < picks; i++) engine.onPointerMove(event(x, y));
		},
		PICKS,
		true,
	);
}
