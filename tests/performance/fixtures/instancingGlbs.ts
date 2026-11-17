import type {BrowserContext, Page} from "@playwright/test";
import {syntheticGlb} from "../syntheticGlb";

/**
 * glb files whose meshes all share vertex count, index count and material,
 * so GPU-instancing detection has to tell them apart. Used by the
 * `instancing` budget, `bench/work.count.ts` and `bench/instancing.bench.ts`.
 *
 * - distinct: independent heights per vertex, no two meshes are copies.
 * - jitter: one wave shifted per mesh. The shifts are dense, so many meshes
 *   lie within the copy tolerance of each other and need the full check.
 * - near: heights drift slowly with the mesh index; runs of meshes become
 *   instances of one source.
 */
export const INSTANCING_KINDS = ["distinct", "jitter", "near"] as const;
export type InstancingKind = (typeof INSTANCING_KINDS)[number];

export const INSTANCING_SIZES = [750, 3000] as const;

export const INSTANCING_FILES = INSTANCING_KINDS.flatMap((kind) =>
	INSTANCING_SIZES.map((meshes) => ({
		name: `${kind}-${meshes}`,
		kind,
		meshes,
	})),
);

const HOST = "https://instancing-perf.viewertests.invalid";
const cache = new Map<string, Buffer>();

function glb(kind: InstancingKind, meshes: number): Buffer {
	const key = `${kind}-${meshes}`;
	let buffer = cache.get(key);
	if (!buffer) {
		buffer = syntheticGlb({
			meshes,
			instancesPerMesh: 1,
			gridSize: 8,
			jitter: kind === "jitter",
			randomJitter: kind === "distinct",
		});
		cache.set(key, buffer);
	}
	return buffer;
}

/** Serve every file of INSTANCING_FILES at `${HOST}/<name>.glb`. */
export async function routeInstancingGlbs(target: Page | BrowserContext) {
	await target.route(`${HOST}/**`, (route) => {
		const name = new URL(route.request().url()).pathname.slice(1);
		const file = INSTANCING_FILES.find((f) => `${f.name}.glb` === name);
		if (!file) return route.fulfill({status: 404, body: name});
		return route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb(file.kind, file.meshes),
		});
	});
}

export type InstancingResult = {
	primitives: number;
	instanceGroups: number;
	withOffset: number;
	/**
	 * 32-bit hash of the detection result: per primitive its instance group
	 * (numbered by first appearance) and offset matrix rounded to 1e-5.
	 */
	resultHash: number;
};

export type InstancingLoad = {
	/** Wall time of DataEngine.loadContent, milliseconds. */
	ms: number;
	/**
	 * Math.max calls during the load. Every rigid-copy comparison of two
	 * primitives calls it, so the count follows the comparison work.
	 */
	comparisonCalls: number;
} & InstancingResult;

/**
 * Fetch one file into a blob URL that the next `startInstancingLoad` of it
 * uses. A load from the network gets the bytes in chunks whose number
 * depends on timing, and every chunk runs progress callbacks; from a blob
 * the load does the same work every time.
 */
export async function prefetchInstancingGlb(page: Page, name: string) {
	await page.evaluate(
		async ({host, name}) => {
			const response = await fetch(`${host}/${name}.glb`);
			const blob = await response.blob();
			const urls = ((window as any).__instancingUrls ??= {});
			if (urls[name]) URL.revokeObjectURL(urls[name]);
			urls[name] = URL.createObjectURL(blob);
		},
		{host: HOST, name},
	);
}

/**
 * Load one file with GPU instancing on (the GeometryEngine default) and keep
 * the tree for `describeInstancingLoad`. Uses the blob URL of
 * `prefetchInstancingGlb` when there is one. With `countComparisons` false,
 * Math.max is left alone and `comparisonCalls` is 0, so a timed load
 * carries no instrumentation.
 */
export async function startInstancingLoad(
	page: Page,
	name: string,
	countComparisons = true,
): Promise<{ms: number; comparisonCalls: number}> {
	return page.evaluate(
		async ({host, name, countComparisons}) => {
			const SDV = (window as any).SDV;
			const href =
				(window as any).__instancingUrls?.[name] ??
				`${host}/${name}.glb`;
			let comparisonCalls = 0;
			const max = Math.max;
			if (countComparisons)
				Math.max = (...values: number[]) => {
					comparisonCalls++;
					return max(...values);
				};
			const start = performance.now();
			try {
				(window as any).__instancingNode =
					await SDV.DataEngine.instance.loadContent({
						format: "glb",
						href,
					});
			} finally {
				Math.max = max;
			}
			return {ms: performance.now() - start, comparisonCalls};
		},
		{host: HOST, name, countComparisons},
	);
}

/** Detection result of the tree `startInstancingLoad` kept. Drops the tree. */
export async function describeInstancingLoad(
	page: Page,
): Promise<InstancingResult> {
	return page.evaluate(() => {
		const node = (window as any).__instancingNode;
		(window as any).__instancingNode = undefined;
		let primitives = 0;
		let withOffset = 0;
		const groups = new Map<string, number>();
		const parts: string[] = [];
		node.traverse((treeNode: any) => {
			treeNode.data?.forEach?.((data: any) => {
				if (!data.primitive) return;
				primitives++;
				let group = -1;
				if (data.instanceHash) {
					if (!groups.has(data.instanceHash))
						groups.set(data.instanceHash, groups.size);
					group = groups.get(data.instanceHash)!;
				}
				const offset = data.instanceOffsetMatrix
					? Array.from(data.instanceOffsetMatrix as number[])
							.map((v) => v.toFixed(5))
							.join(",")
					: "";
				if (offset) withOffset++;
				parts.push(`${group}|${offset}`);
			});
		});
		const text = parts.join(";");
		let resultHash = 2166136261;
		for (let i = 0; i < text.length; i++)
			resultHash = Math.imul(resultHash ^ text.charCodeAt(i), 16777619);
		return {
			primitives,
			instanceGroups: groups.size,
			withOffset,
			resultHash: resultHash >>> 0,
		};
	});
}

/** Load one file and describe the detection result. */
export async function loadInstancingGlb(
	page: Page,
	name: string,
	countComparisons = true,
): Promise<InstancingLoad> {
	const load = await startInstancingLoad(page, name, countComparisons);
	return {...load, ...(await describeInstancingLoad(page))};
}
