import {count, type Viewer} from "./context";

/** Even, so the section leaves the scene as it found it. */
const UPDATES = 4;

export const label = `One-node scene update x${UPDATES}`;

export const run = (viewer: Viewer) =>
	count(
		viewer,
		"oneNodeUpdate",
		(updates) => {
			const probe = (window as any).__probe;
			for (let i = 0; i < updates; i++) probe.timeOneNodeChange();
		},
		UPDATES,
	);
