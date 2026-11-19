import {count, loadContent, PLAIN_GLB_HREF, type Viewer} from "./context";

export const label = "glTF load, facade-sized glb (DataEngine.loadContent)";

export const run = (viewer: Viewer) =>
	count(viewer, "gltfPlain", loadContent, {
		format: "glb",
		href: PLAIN_GLB_HREF,
	});
