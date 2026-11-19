import {count, type Viewer} from "./context";

export const label = "Fixture version update, updateVersion() on its root";

/**
 * Last on the shared page: it re-versions every fixture node, as adding a
 * session does, so the next scene update would convert the whole fixture
 * again.
 */
export const run = (viewer: Viewer) =>
	count(viewer, "versionUpdate", () =>
		(window as any).__probe.aec.root.updateVersion(),
	);
