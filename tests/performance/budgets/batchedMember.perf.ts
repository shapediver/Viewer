import {expect, test, type Page} from "@playwright/test";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {openViewer} from "../fixtures/probe";
import {
	compare,
	Counters,
	createScene,
	isSoftwareRenderer,
	settle,
	UPDATE,
	writeBaseline,
} from "./harness";

/**
 * Changes to one member of a batch (SS-10477). The facade's 1,280 mullions
 * and 1,280 transoms are one metal batch of 2,560 instances. A scene update
 * has to touch that member and nothing else: no other batch, no vertex of
 * another member, no matrix of another member, and no walk over the whole
 * tree.
 *
 * Each scenario counts the change and the first frame drawn after it, the
 * same window as `oneNodeChange.*` in `facade.perf.ts`:
 * - `mullionHidden`: one mullion is hidden, as the one-node change does with
 *   a glass pane. Glass is not batched in the default scene, so this is the
 *   case `oneNodeChange` cannot show.
 * - `mullionReplaced`: one mullion gets a new geometry data with a geometry
 *   of its own, as a parameter change that replaces an output does. The
 *   other mullions share one geometry.
 * - `mullionVersioned`: that geometry data gets a new version. Its
 *   primitive is used by this member alone, so the viewer builds the mesh
 *   and its geometry again, with the same content: the member has to take
 *   the new geometry without a rebuild of the chunk.
 *
 * Software-safe: shadows are off and nothing here is a pixel or a time.
 */

async function runToFirstFrame(page: Page) {
	for (let steps = 1; steps <= 100; steps++) {
		await page.waitForFunction(() =>
			(window as any).__probe.programsReady(),
		);
		await page.clock.runFor(16);
		if (await page.evaluate(() => (window as any).__probe.frames().length))
			return steps;
	}
	throw new Error("The viewer drew no frame after the change.");
}

type Change = "hide" | "replace" | "version";

async function change(page: Page, prefix: string, kind: Change) {
	await page.evaluate(() => {
		(window as any).__probe.trackTreeDataReads();
		(window as any).__probe.reset();
	});
	await page.evaluate((what) => {
		const SDV = (window as any).SDV;
		const probe = (window as any).__probe;
		const nodes = probe.aec.mullionNodes;
		const target = nodes[Math.floor(nodes.length / 2)];
		if (what === "hide") {
			target.visible = !target.visible;
		} else if (what === "version") {
			(window as any).__replacement.updateVersion();
		} else {
			const old = target.data.find(
				(data: any) => data instanceof SDV.GeometryData,
			);
			// A new primitive that nobody else draws.
			const primitive = (window as any).__aec.boxPrimitive(
				[-0.06, -0.1, 0.3],
				[0.07, 0.1, 3.5],
			);
			const replacement = new SDV.GeometryData(
				primitive,
				SDV.PRIMITIVE_MODE.TRIANGLES,
			);
			replacement.material = old.material;
			(window as any).__replacement = replacement;
			target.removeData(old);
			target.addData(replacement);
		}
		target.updateVersion();
		probe.viewport.update();
	}, kind);
	const sync = await page.evaluate(() =>
		(window as any).__probe.readCounters(),
	);
	const steps = await runToFirstFrame(page);
	const result = await page.evaluate(() => ({
		counters: (window as any).__probe.readCounters(),
		picks: (window as any).__probe.picks(),
		stats: (window as any).__probe.stats(),
	}));
	const batched = result.counters.batchedMesh;
	const counters: Counters = {
		[`${prefix}.batchesCreated`]: batched.batchesCreated,
		[`${prefix}.batchesRemoved`]: batched.batchesRemoved,
		[`${prefix}.vertexCopies`]: batched.vertexCopies,
		[`${prefix}.indexCopies`]: batched.indexCopies,
		[`${prefix}.geometryWrites`]: batched.geometryWrites,
		[`${prefix}.instancesAdded`]: batched.instancesAdded,
		[`${prefix}.instancesDeleted`]: batched.instancesDeleted,
		[`${prefix}.membersReapplied`]: batched.matrixWrites,
		[`${prefix}.bufferGrowths`]: batched.bufferGrowths,
		[`${prefix}.instanceGrowths`]: batched.instanceGrowths,
		[`${prefix}.optimizes`]: batched.optimizes,
		[`${prefix}.treeDataReads`]: result.picks.treeDataReads,
		[`${prefix}.updateMatrixWorldCalls`]: result.counters.matrixWorld.total,
		[`${prefix}.updateWorldMatrixCalls`]:
			result.counters.matrixWorld.worldMatrixTotal,
		[`${prefix}.programCacheKeyCalls`]:
			result.counters.programCacheKey.calls,
		[`${prefix}.batchedMeshes`]: result.stats.batchedMeshes,
	};
	console.log(
		`${prefix}: ` +
			JSON.stringify({
				clockSteps: steps,
				inUpdate: {
					updateMatrixWorld: sync.matrixWorld.total,
					updateWorldMatrix: sync.matrixWorld.worldMatrixTotal,
					membersReapplied: sync.batchedMesh.matrixWrites,
				},
			}),
	);
	return counters;
}

async function collectBatchedMember(page: Page): Promise<Counters> {
	await createScene(
		page,
		{id: "batchedMember", shadows: false, ssao: false},
		AEC_DEFAULT,
	);
	await settle(page);
	const batches = await page.evaluate(
		() => (window as any).__probe.stats().batchedMeshes,
	);
	// The scenarios mean nothing if the mullions are not batched.
	expect(batches, "the default scene has no batch").toBeGreaterThan(0);

	const counters: Counters = {};
	Object.assign(counters, await change(page, "mullionHidden", "hide"));
	Object.assign(counters, await change(page, "mullionReplaced", "replace"));
	Object.assign(counters, await change(page, "mullionVersioned", "version"));
	return counters;
}

test("budget: AEC facade, batchedMember", async ({page}) => {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page, "/index.html", {counters: true});
	if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

	const counters = await collectBatchedMember(page);
	if (UPDATE) {
		writeBaseline("batchedMember", counters);
		return;
	}
	expect(compare("batchedMember", counters).join("\n")).toBe("");
});
