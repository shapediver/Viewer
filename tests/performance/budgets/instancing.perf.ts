import {expect, test} from "@playwright/test";
import {
	INSTANCING_FILES,
	loadInstancingGlb,
	routeInstancingGlbs,
} from "../fixtures/instancingGlbs";
import {openViewer} from "../fixtures/probe";
import {compare, Counters, UPDATE, writeBaseline} from "./harness";

// glTF loading with GPU-instancing detection, see the instancing budget test.
const INSTANCING = "instancing";

/**
 * GPU-instancing detection on glb files whose meshes share vertex count,
 * index count and material. Counts the comparison work and pins the
 * detection result, so a faster detection cannot change which primitives
 * become instances.
 */
test("budget: GPU-instancing detection, same-count meshes", async ({page}) => {
	// development before SS-10455 needs about a minute on a laptop.
	test.setTimeout(300_000);
	await openViewer(page);
	await routeInstancingGlbs(page);
	const counters: Counters = {};
	for (const file of INSTANCING_FILES) {
		const result = await loadInstancingGlb(page, file.name);
		for (const key of [
			"comparisonCalls",
			"primitives",
			"instanceGroups",
			"withOffset",
			"resultHash",
		] as const)
			counters[`${INSTANCING}.${file.name}.${key}`] = result[key];
	}
	if (UPDATE) {
		writeBaseline(INSTANCING, counters);
		return;
	}
	// Distinct meshes: 4x the meshes may cost 4x the comparisons, not 16x.
	const growth =
		counters[`${INSTANCING}.distinct-3000.comparisonCalls`] /
		counters[`${INSTANCING}.distinct-750.comparisonCalls`];
	expect(growth, JSON.stringify(counters)).toBeLessThan(6);
	expect(compare(INSTANCING, counters).join("\n")).toBe("");
});
