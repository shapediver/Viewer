import {expect, type Page} from "@playwright/test";
import {syntheticGlb} from "../syntheticGlb";
import {ASSET_HOST, open, test} from "./harness";

/**
 * Load a glb with GPU instancing on and report what the instancing detection
 * did:
 * - `keyBuilds`: the exact and the cheap key of a primitive are built by
 *   `JSON.stringify` of an object with the keys `attributes`, `indices`,
 *   `material` and `mode`, so counting those calls counts both builds, two per
 *   fingerprinted primitive,
 * - `primitives`, `instanceGroups` (distinct instance hashes) and `withOffset`
 *   (primitives that carry an offset matrix),
 * - `resultHash`: a hash of every primitive's node name, instance hash and
 *   offset matrix, in tree order. It is the same when the same instances are
 *   found for the same nodes.
 */
async function loadAndDescribe(page: Page, file: string) {
	return page.evaluate(
		async ({host, file}) => {
			const SDV = (window as any).SDV;
			let keyBuilds = 0;
			const stringify = JSON.stringify;
			JSON.stringify = function (
				this: unknown,
				value: any,
				...rest: any[]
			) {
				if (
					value &&
					typeof value === "object" &&
					"attributes" in value &&
					"indices" in value &&
					"material" in value &&
					"mode" in value
				)
					keyBuilds++;
				return (stringify as any).call(this, value, ...rest);
			} as typeof JSON.stringify;
			let node;
			try {
				node = await SDV.DataEngine.instance.loadContent({
					format: "glb",
					href: `${host}/${file}`,
				});
			} finally {
				JSON.stringify = stringify;
			}
			const records: [string, string | null, number[] | null][] = [];
			node.traverse((treeNode: any) => {
				treeNode.data?.forEach?.((data: any) => {
					if (!data.primitive) return;
					records.push([
						treeNode.name,
						data.instanceHash ?? null,
						data.instanceOffsetMatrix
							? Array.from(
									data.instanceOffsetMatrix as number[],
								).map((value) => Math.round(value * 1e4) / 1e4)
							: null,
					]);
				});
			});
			const text = stringify(records);
			let hash = 2166136261;
			for (let i = 0; i < text.length; i++) {
				hash ^= text.charCodeAt(i);
				hash = Math.imul(hash, 16777619);
			}
			return {
				keyBuilds,
				primitives: records.length,
				instanceGroups: new Set(
					records.map((record) => record[1]).filter(Boolean),
				).size,
				withOffset: records.filter((record) => record[2]).length,
				resultHash: (hash >>> 0).toString(16),
			};
		},
		{host: ASSET_HOST, file},
	);
}

async function routeGlb(page: Page, name: string, glb: Buffer) {
	await page.route(`${ASSET_HOST}/${name}`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
}

const SYNTHETIC = {
	meshes: 3,
	instancesPerMesh: 100,
	gridSize: 8,
	randomJitter: true,
};

/**
 * What `development` found before SS-10552, recorded with the same loader:
 * the same primitives, the same instance groups, the same result hash. Only
 * `keyBuilds` of a mesh that several nodes share is meant to change.
 */
const BEFORE = {
	"shared-mesh-boxes.glb": {
		keyBuilds: 18,
		primitives: 9,
		instanceGroups: 1,
		withOffset: 0,
		resultHash: "f0d50742",
	},
	"shared-synthetic.glb": {
		keyBuilds: 600,
		primitives: 300,
		instanceGroups: 3,
		withOffset: 0,
		resultHash: "50920ed4",
	},
	"duplicated-boxes.glb": {
		keyBuilds: 20,
		primitives: 12,
		instanceGroups: 1,
		withOffset: 0,
		resultHash: "179dbf1d",
	},
	"baked-boxes.glb": {
		keyBuilds: 12,
		primitives: 6,
		instanceGroups: 1,
		withOffset: 5,
		resultHash: "46914d61",
	},
};

const {keyBuilds: _shared, ...SHARED_RESULT} = BEFORE["shared-mesh-boxes.glb"];
const {keyBuilds: _synthetic, ...SYNTHETIC_RESULT} =
	BEFORE["shared-synthetic.glb"];
void _shared;
void _synthetic;

test("SS-10552 nodes that share a mesh fingerprint it once", async ({page}) => {
	await open(page);
	const result = await loadAndDescribe(page, "shared-mesh-boxes.glb");
	// The same instances for the same nodes as before.
	expect(result, JSON.stringify(result)).toEqual({
		...SHARED_RESULT,
		// One mesh used by nine nodes: both keys of its one primitive, not
		// of every node (was 18).
		keyBuilds: 2,
	});
});

test("SS-10552 300 nodes that share 3 meshes build 6 keys, not 600", async ({
	page,
}) => {
	await open(page);
	await routeGlb(page, "shared-synthetic.glb", syntheticGlb(SYNTHETIC));
	const result = await loadAndDescribe(page, "shared-synthetic.glb");
	expect(result, JSON.stringify(result)).toEqual({
		...SYNTHETIC_RESULT,
		keyBuilds: 6,
	});
});

test("SS-10552 stored separately: the fingerprint stays and finds the same instances", async ({
	page,
}) => {
	await open(page);
	for (const file of ["duplicated-boxes.glb", "baked-boxes.glb"]) {
		const result = await loadAndDescribe(page, file);
		expect(result, file + " " + JSON.stringify(result)).toEqual(
			BEFORE[file as keyof typeof BEFORE],
		);
	}
});
