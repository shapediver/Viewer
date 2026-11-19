import {count, DRACO_GLTF_HREF, loadContent, type Viewer} from "./context";

export const label = "glTF load, Draco glTF (DataEngine.loadContent)";

export const run = (viewer: Viewer) =>
	count(viewer, "gltfDraco", loadContent, {
		format: "gltf",
		href: DRACO_GLTF_HREF,
	});
