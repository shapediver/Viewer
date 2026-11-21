import {count, type Viewer} from "./context";

/** Even, so the section ends with the original geometry again. */
const UPDATES = 4;

export const label = `One batched mullion replaced x${UPDATES} (SS-10477)`;

/**
 * One mullion gets a new geometry, as every parameter change that replaces
 * an output does. The last update puts the original geometry back.
 */
export const run = (viewer: Viewer) =>
	count(
		viewer,
		"batchedMemberReplaced",
		(updates) => {
			const SDV = (window as any).SDV;
			const probe = (window as any).__probe;
			const nodes = probe.aec.mullionNodes;
			const target = nodes[Math.floor(nodes.length / 2)];
			const original = target.data.find(
				(data: any) => data instanceof SDV.GeometryData,
			);
			let current = original;
			for (let i = 0; i < updates; i++) {
				let next = original;
				if (i < updates - 1) {
					next = new SDV.GeometryData(
						(window as any).__aec.boxPrimitive(
							[-0.06, -0.1, 0.3],
							[0.06 + 0.01 * (i + 1), 0.1, 3.5],
						),
						SDV.PRIMITIVE_MODE.TRIANGLES,
					);
					next.material = original.material;
				}
				target.removeData(current);
				target.addData(next);
				target.updateVersion();
				probe.viewport.update();
				current = next;
			}
		},
		UPDATES,
		true,
	);
