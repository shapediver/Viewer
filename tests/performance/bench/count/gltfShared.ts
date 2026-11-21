import {count, loadContent, SHARED_GLB_HREF, type Viewer} from "./context";

export const label =
	"glTF load, 5 meshes used by 1,000 nodes each (DataEngine.loadContent)";

export const run = (viewer: Viewer) =>
	count(viewer, "gltfShared", loadContent, {
		format: "glb",
		href: SHARED_GLB_HREF,
	});
