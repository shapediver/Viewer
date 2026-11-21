import {count, type Viewer} from "./context";

const UPDATES = 4;

export const label = `One batched mullion, new version of its geometry x${UPDATES} (SS-10477)`;

/**
 * The mullion has a geometry of its own (set up before the count). A new
 * version of its data makes the viewer build the mesh and its geometry
 * again with the same content. The member takes the new geometry in its
 * batch, or the whole chunk is rebuilt.
 */
export const run = async (viewer: Viewer) => {
	await viewer.page.evaluate(() => {
		const SDV = (window as any).SDV;
		const probe = (window as any).__probe;
		const nodes = probe.aec.mullionNodes;
		const target = nodes[Math.floor(nodes.length / 2)];
		const old = target.data.find(
			(data: any) => data instanceof SDV.GeometryData,
		);
		const replacement = new SDV.GeometryData(
			(window as any).__aec.boxPrimitive(
				[-0.06, -0.1, 0.3],
				[0.07, 0.1, 3.5],
			),
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		replacement.material = old.material;
		target.removeData(old);
		target.addData(replacement);
		target.updateVersion();
		probe.viewport.update();
		(window as any).__versioned = {target, replacement};
	});
	return count(
		viewer,
		"batchedMemberVersioned",
		(updates) => {
			const probe = (window as any).__probe;
			const {target, replacement} = (window as any).__versioned;
			for (let i = 0; i < updates; i++) {
				replacement.updateVersion();
				target.updateVersion();
				probe.viewport.update();
			}
		},
		UPDATES,
		true,
	);
};
