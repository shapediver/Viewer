import {count, type Viewer} from "./context";

/** Even, so the section leaves the scene as it found it. */
const UPDATES = 4;

export const label = `One batched mullion hidden x${UPDATES} (SS-10477)`;

/**
 * The mullions are one metal batch. Glass is not batched in the default
 * scene, so "One-node scene update" never reaches a batch member.
 */
export const run = (viewer: Viewer) =>
	count(
		viewer,
		"batchedMemberHidden",
		(updates) => {
			const probe = (window as any).__probe;
			const nodes = probe.aec.mullionNodes;
			const target = nodes[Math.floor(nodes.length / 2)];
			for (let i = 0; i < updates; i++) {
				target.visible = !target.visible;
				target.updateVersion();
				probe.viewport.update();
			}
		},
		UPDATES,
	);
