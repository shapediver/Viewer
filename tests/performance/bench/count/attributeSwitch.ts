import {ATTRIBUTE_SCENE, count, settle, type Viewer} from "./context";

export const label = `Attribute switch on ${ATTRIBUTE_SCENE.floors} floor, zone to load (separate page)`;

/**
 * The attribute visualization replaces the material of every item and
 * re-converts each node, so the viewer rebuilds its batches per node. Its
 * own page (`ownPage` in `index.ts`), because it needs a smaller tower and
 * stays in attribute mode.
 */
export async function run(viewer: Viewer) {
	await viewer.page.evaluate((options) => {
		const probe = (window as any).__probe;
		probe.build(options);
		probe.show({id: "attributes", shadows: false, ssao: false});
	}, ATTRIBUTE_SCENE);
	await settle(viewer);
	// Uncounted: the engine, attribute mode and the first visualization.
	await viewer.page.evaluate(() => {
		const probe = (window as any).__probe;
		probe.setupAttributes();
		probe.showAttribute("zone");
	});
	return count(viewer, "attributeSwitch", () =>
		(window as any).__probe.showAttribute("load"),
	);
}
