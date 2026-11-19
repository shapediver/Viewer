import {expect, type Page} from "@playwright/test";
import {syntheticGlb} from "../syntheticGlb";
import {ASSET_HOST, open, test} from "./harness";

/**
 * Load a synthetic glb with GPU instancing on and count Math.max calls.
 * Every rigid-copy comparison of two primitives calls Math.max, so the
 * count follows the comparison work of instancing detection.
 */
async function loadCountingComparisons(page: Page, name: string, glb: Buffer) {
	await page.route(`${ASSET_HOST}/${name}`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
	return page.evaluate(
		async ({host, name}) => {
			const SDV = (window as any).SDV;
			let calls = 0;
			const max = Math.max;
			Math.max = (...values: number[]) => {
				calls++;
				return max(...values);
			};
			let node;
			try {
				node = await SDV.DataEngine.instance.loadContent({
					format: "glb",
					href: `${host}/${name}`,
				});
			} finally {
				Math.max = max;
			}
			let primitives = 0;
			let withOffset = 0;
			const groups = new Set<string>();
			node.traverse((treeNode: any) => {
				treeNode.data?.forEach?.((data: any) => {
					if (!data.primitive) return;
					primitives++;
					if (data.instanceHash) groups.add(data.instanceHash);
					if (data.instanceOffsetMatrix) withOffset++;
				});
			});
			return {calls, primitives, groups: groups.size, withOffset};
		},
		{host: ASSET_HOST, name},
	);
}

test("SS-10455 instancing detection work grows linearly with distinct meshes", async ({
	page,
}) => {
	await open(page);
	// Same vertex and index counts and material, different shapes. On
	// development every mesh is compared with every earlier one: 4x the
	// meshes cost about 15x the comparisons (136k -> 2.06M Math.max calls
	// for 500 -> 2000 meshes). Linear is 4x.
	const distinct = (meshes: number) =>
		syntheticGlb({
			meshes,
			instancesPerMesh: 1,
			gridSize: 8,
			randomJitter: true,
		});
	const small = await loadCountingComparisons(
		page,
		"distinct-500.glb",
		distinct(500),
	);
	const large = await loadCountingComparisons(
		page,
		"distinct-2000.glb",
		distinct(2000),
	);
	const result = {small, large, ratio: large.calls / small.calls};
	expect(small.primitives, JSON.stringify(result)).toBe(500);
	expect(large.primitives, JSON.stringify(result)).toBe(2000);
	// No two meshes are copies, so none becomes an instance.
	expect(small.groups, JSON.stringify(result)).toBe(0);
	expect(large.groups, JSON.stringify(result)).toBe(0);
	expect(result.ratio, JSON.stringify(result)).toBeLessThan(6);
});

test("SS-10455 near copies become the same instances as before", async ({
	page,
}) => {
	await open(page);
	// Meshes whose heights drift slowly with the mesh index: each matches
	// the earlier meshes within tolerance until the drift exceeds it.
	// Numbers measured on development before SS-10455.
	const result = await loadCountingComparisons(
		page,
		"near-copies-750.glb",
		syntheticGlb({meshes: 750, instancesPerMesh: 1, gridSize: 8}),
	);
	expect(result.primitives, JSON.stringify(result)).toBe(750);
	expect(result.groups, JSON.stringify(result)).toBe(188);
	expect(result.withOffset, JSON.stringify(result)).toBe(562);
});
