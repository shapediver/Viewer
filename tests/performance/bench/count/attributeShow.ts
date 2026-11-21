import {ATTRIBUTE_SCENE, count, settle, type Viewer} from "./context";

export const label = `Entering the attribute visualization on ${ATTRIBUTE_SCENE.floors} floor (separate page)`;

/**
 * Standard mode to attribute mode: the renderer-type switch converts the
 * scene, then the engine updates every item. Its own page (`ownPage` in
 * `index.ts`), because it needs a smaller tower and leaves standard mode.
 */
export async function run(viewer: Viewer) {
	await viewer.page.evaluate((options) => {
		const probe = (window as any).__probe;
		probe.build(options);
		probe.show({id: "attributes", shadows: false, ssao: false});
	}, ATTRIBUTE_SCENE);
	await settle(viewer);
	// Uncounted: the sdTF data of the items.
	await viewer.page.evaluate(() => (window as any).__probe.setupAttributes());
	await settle(viewer);
	return count(viewer, "attributeShow", () =>
		(window as any).__probe.showAttribute("zone"),
	);
}
