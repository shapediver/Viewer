import {type Page} from "@playwright/test";

/**
 * Memory figures of the page (SS-10582), read from the test script.
 *
 * - `jsHeap`: the JavaScript heap after a forced garbage collection, through
 *   the browser's debugging protocol. Depends on the browser version and on
 *   when V8 compacts, so it is reported and compared with a tolerance, never
 *   put into a baseline.
 * - `gpuMemory`: what the viewer allocates on its WebGL context, counted by
 *   `counters/gpuMemory.ts` (needs `openViewer(page, url, {counters: true})`),
 *   plus three.js' own counts. Exact and the same on every run of one
 *   renderer, so it goes into a baseline. It is a count of what the viewer
 *   asks for, not what the driver really uses.
 */

export type JsHeap = {
	/** Live objects on the V8 heap. */
	usedBytes: number;
	/** ArrayBuffer backing stores (geometry arrays), outside the V8 heap. 0 if the browser does not report it. */
	backingStorageBytes: number;
	/** `usedBytes + backingStorageBytes`. */
	totalBytes: number;
};

export async function jsHeap(page: Page): Promise<JsHeap> {
	const cdp = await page.context().newCDPSession(page);
	try {
		// Twice: objects freed by finalizers of the first pass go in the second.
		await cdp.send("HeapProfiler.collectGarbage");
		await cdp.send("HeapProfiler.collectGarbage");
		const usage = (await cdp.send("Runtime.getHeapUsage")) as {
			usedSize: number;
			backingStorageSize?: number;
		};
		const backingStorageBytes = usage.backingStorageSize ?? 0;
		return {
			usedBytes: usage.usedSize,
			backingStorageBytes,
			totalBytes: usage.usedSize + backingStorageBytes,
		};
	} finally {
		await cdp.detach();
	}
}

/** GPU allocations and three.js' counts, as budget counters under `prefix`. */
export async function gpuMemory(
	page: Page,
	prefix: string,
): Promise<Record<string, number>> {
	const result = await page.evaluate(() => {
		const probe = (window as any).__probe;
		const info = probe.renderer.info;
		return {
			gpu: probe.counters.gpuMemory.read() as Record<string, number>,
			geometries: info.memory.geometries as number,
			textures: info.memory.textures as number,
			programs: (info.programs ? info.programs.length : 0) as number,
			drawingBufferPixels: (probe.gl.drawingBufferWidth *
				probe.gl.drawingBufferHeight) as number,
		};
	});
	const counters: Record<string, number> = {};
	for (const [key, value] of Object.entries(result.gpu))
		counters[`${prefix}.gpu.${key}`] = value;
	counters[`${prefix}.three.geometries`] = result.geometries;
	counters[`${prefix}.three.textures`] = result.textures;
	counters[`${prefix}.three.programs`] = result.programs;
	// The canvas' own buffer is not a WebGL allocation; its size is given here.
	counters[`${prefix}.canvas.drawingBufferPixels`] =
		result.drawingBufferPixels;
	return counters;
}

export function megabytes(bytes: number) {
	return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}
