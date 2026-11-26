import {expect, type Page} from "@playwright/test";
import {
	CUBE_FACES,
	HDR,
	installEnvironmentMapProbe,
	serveEnvironmentAssets,
	type WorkerMode,
} from "../fixtures/environmentMap";
import {open, skipOnSoftwareRenderer, test} from "./harness";

/**
 * SS-10619: the environment map is prepared without blocking the main thread.
 * The .hdr file is decoded in a worker, with a fallback to the main thread,
 * and the prefilter programs link in the background before the prefilter
 * draws with them.
 *
 * Values on `development` before the change (GPU, Intel UHD 630):
 * blockingProgramQueries 1 to 2 for a cold .hdr load, the other size and a
 * six-image map; hdrDecodesInWorker 0, hdrDecodesOnMainThread 1.
 */

const pixels = (map: {width: number; height: number}) =>
	map.width * map.height * 4;

type Counters = {
	workersCreated: number;
	hdrDecodesInWorker: number;
	hdrDecodesOnMainThread: number;
	programsLinked: number;
	pmremProgramsLinked: number;
	pmremProgramsCreated: number;
	blockingProgramQueries: number;
};
type LoadResult = {
	status: string;
	starts: number;
	ends: number;
	cancels: number;
};

/** Errors thrown in the page or unhandled rejections, and console errors. */
function collectErrors(page: Page) {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(`pageerror: ${error}`));
	page.on("console", (message) => {
		if (message.type() === "error")
			errors.push(`console: ${message.text()}`);
	});
	return errors;
}

/**
 * Open the page, create the viewport and install the counters.
 * `parallel: false` hides KHR_parallel_shader_compile from the viewer.
 */
async function setup(
	page: Page,
	options: {workerMode?: WorkerMode; parallel?: boolean} = {},
) {
	await serveEnvironmentAssets(page);
	await open(page);
	if (options.parallel === false)
		await page.evaluate(() => {
			for (const context of [
				WebGL2RenderingContext,
				WebGLRenderingContext,
			]) {
				const getExtension = context.prototype.getExtension;
				context.prototype.getExtension = function (
					this: WebGLRenderingContext,
					name: string,
				) {
					if (name === "KHR_parallel_shader_compile") return null;
					return getExtension.call(this, name);
				} as typeof getExtension;
			}
		});
	await page.evaluate(() => (window as any).__perf.create());
	await page.evaluate(installEnvironmentMapProbe);
	// three.js queries the program status (the blocking call that is counted)
	// only with this on
	expect(
		await page.evaluate(
			() => (window as any).__perf.renderer.debug.checkShaderErrors,
		),
	).toBe(true);
	await page.evaluate(
		(mode) => ((window as any).__perf.env.workerMode = mode),
		options.workerMode ?? "normal",
	);
}

/** One box with a standard material, drawn once. */
async function showBox(page: Page) {
	await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#ffffff",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
	});
}

/** Load a map and draw the next frame. Counts from the call on. */
async function load(
	page: Page,
	value: string | string[],
	expectPixels = -1,
): Promise<{result: LoadResult; counters: Counters}> {
	return page.evaluate(
		async ({value, expectPixels}) => {
			const perf = (window as any).__perf;
			perf.env.reset();
			const result = await perf.env.load(value, expectPixels);
			perf.viewport.update();
			await perf.nextFrame();
			return {result, counters: perf.env.read()};
		},
		{value, expectPixels},
	);
}

test.describe("SS-10619 program links do not block", () => {
	test("an .hdr load does not wait for a program link", async ({page}) => {
		await skipOnSoftwareRenderer(
			page,
			"SwiftShader has no parallel shader compile",
		);
		await setup(page);
		await showBox(page);
		expect(
			await page.evaluate(() => (window as any).__perf.env.parallel),
		).toBe(true);

		const {result, counters} = await load(page, HDR.a.url, pixels(HDR.a));
		const detail = JSON.stringify({result, counters});
		expect(result.status, detail).toBe("end");
		// the prefilter programs were created in this load (cold)
		expect(counters.pmremProgramsCreated, detail).toBeGreaterThan(0);
		expect(counters.blockingProgramQueries, detail).toBe(0);
	});

	test("a map of another size links its own programs without waiting", async ({
		page,
	}) => {
		await skipOnSoftwareRenderer(
			page,
			"SwiftShader has no parallel shader compile",
		);
		await setup(page);
		await showBox(page);
		expect((await load(page, HDR.a.url, pixels(HDR.a))).result.status).toBe(
			"end",
		);

		const {result, counters} = await load(page, HDR.c.url, pixels(HDR.c));
		const detail = JSON.stringify({result, counters});
		expect(result.status, detail).toBe("end");
		// the GGX program depends on the cube size
		expect(counters.pmremProgramsLinked, detail).toBeGreaterThan(0);
		expect(counters.blockingProgramQueries, detail).toBe(0);
	});

	test("a six-image map is prefiltered without waiting for a link", async ({
		page,
	}) => {
		await skipOnSoftwareRenderer(
			page,
			"SwiftShader has no parallel shader compile",
		);
		await setup(page);
		await showBox(page);

		// three.js prefilters the cube map in the first frame that uses it
		const {result, counters} = await load(page, CUBE_FACES);
		const detail = JSON.stringify({result, counters});
		expect(result.status, detail).toBe("end");
		expect(counters.pmremProgramsCreated, detail).toBeGreaterThan(0);
		expect(counters.blockingProgramQueries, detail).toBe(0);
	});

	test("closing the viewport during the load leaves nothing behind", async ({
		page,
	}) => {
		await skipOnSoftwareRenderer(
			page,
			"SwiftShader has no parallel shader compile",
		);
		const errors = collectErrors(page);
		await setup(page);
		const after = await page.evaluate(async (url) => {
			const perf = (window as any).__perf;
			const gl = perf.gl;
			let callsAfterClose = 0;
			let closed = false;
			for (const name of [
				"linkProgram",
				"getProgramParameter",
				"getProgramInfoLog",
				"useProgram",
				"drawArrays",
				"drawElements",
				"texImage2D",
				"bindFramebuffer",
			]) {
				const original = gl[name].bind(gl);
				gl[name] = (...args: unknown[]) => {
					if (closed) callsAfterClose++;
					return original(...args);
				};
			}
			const unhandled: string[] = [];
			window.addEventListener("unhandledrejection", (event) =>
				unhandled.push(String(event.reason)),
			);
			const loading = perf.env.load(url);
			await perf.viewport.close();
			closed = true;
			await new Promise((resolve) => setTimeout(resolve, 2000));
			// the task is cancelled, not ended
			const events = await loading;
			return {callsAfterClose, unhandled, events};
		}, HDR.a.url);
		expect(after.callsAfterClose, JSON.stringify(after)).toBe(0);
		expect(after.events, JSON.stringify(after)).toEqual({
			status: "cancel",
			starts: 1,
			ends: 0,
			cancels: 1,
		});
		expect(after.unhandled, JSON.stringify(after)).toEqual([]);
		expect(errors).toEqual([]);
	});
});

test.describe("SS-10619 .hdr decode", () => {
	test("an .hdr file is decoded in a worker, with the same map as on the main thread", async ({
		page,
		context,
	}) => {
		// the same file in a page with a worker and in one without
		const hashes: unknown[] = [];
		for (const mode of ["normal", "missing"] as WorkerMode[]) {
			const target = mode === "normal" ? page : await context.newPage();
			await setup(target, {workerMode: mode});
			await showBox(target);
			const {result, counters} = await load(
				target,
				HDR.a.url,
				pixels(HDR.a),
			);
			const detail = JSON.stringify({mode, result, counters});
			expect(result.status, detail).toBe("end");
			expect(counters.hdrDecodesInWorker, detail).toBe(
				mode === "normal" ? 1 : 0,
			);
			expect(counters.hdrDecodesOnMainThread, detail).toBe(
				mode === "normal" ? 0 : 1,
			);
			const hash = await target.evaluate(() =>
				(window as any).__perf.env.mapHash(),
			);
			expect(hash, detail).not.toBeNull();
			expect(hash.nonZero, detail).toBeGreaterThan(0);
			hashes.push(hash);
		}
		expect(hashes[1]).toEqual(hashes[0]);
	});

	for (const mode of [
		"missing",
		"securityError",
		"failsAtStart",
		"cloneError",
	] as WorkerMode[])
		test(`falls back to the main thread: ${mode}`, async ({page}) => {
			const errors = collectErrors(page);
			await setup(page, {workerMode: mode});

			const first = await load(page, HDR.a.url, pixels(HDR.a));
			const detail = JSON.stringify(first);
			expect(first.result.status, detail).toBe("end");
			expect(first.counters.hdrDecodesOnMainThread, detail).toBe(1);
			expect(first.counters.hdrDecodesInWorker, detail).toBe(0);

			// the next load does not try another worker
			await page.evaluate(
				() => ((window as any).__perf.env.workerMode = "normal"),
			);
			const second = await load(page, HDR.b.url, pixels(HDR.b));
			const detail2 = JSON.stringify(second);
			expect(second.result.status, detail2).toBe("end");
			expect(second.counters.workersCreated, detail2).toBe(0);
			expect(second.counters.hdrDecodesOnMainThread, detail2).toBe(1);
			expect(errors).toEqual([]);
		});

	test("a file that is not an .hdr fails as before and the worker stays usable", async ({
		page,
	}) => {
		const errors = collectErrors(page);
		await setup(page);

		const bad = await load(page, HDR.bad.url);
		const detail = JSON.stringify(bad);
		expect(bad.result.status, detail).toBe("cancel");
		expect(bad.counters.hdrDecodesInWorker, detail).toBe(1);
		const loaderError = errors.find((e) =>
			e.includes("Was not able to load environment map"),
		);
		expect(loaderError, JSON.stringify(errors)).toContain(HDR.bad.url);

		const next = await load(page, HDR.a.url, pixels(HDR.a));
		const detail2 = JSON.stringify(next);
		expect(next.result.status, detail2).toBe("end");
		expect(next.counters.workersCreated, detail2).toBe(0);
		expect(next.counters.hdrDecodesInWorker, detail2).toBe(1);
		expect(next.counters.hdrDecodesOnMainThread, detail2).toBe(0);
	});

	test("a second viewport decodes the cached file again", async ({page}) => {
		await setup(page);
		expect((await load(page, HDR.a.url, pixels(HDR.a))).result.status).toBe(
			"end",
		);
		const second = await page.evaluate(async (url) => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			const canvas = document.createElement("canvas");
			canvas.width = 64;
			canvas.height = 64;
			document.body.appendChild(canvas);
			const viewport = await SDV.createViewport({
				canvas,
				id: "perf2",
				visibility: SDV.VISIBILITY_MODE.MANUAL,
			});
			perf.env.reset();
			const result = await perf.env.load(url, -1, viewport);
			return {result, counters: perf.env.read()};
		}, HDR.a.url);
		const detail = JSON.stringify(second);
		expect(second.result.status, detail).toBe("end");
		// a transferred (emptied) cache entry would not start with "#?"
		expect(second.counters.hdrDecodesInWorker, detail).toBe(1);
		expect(second.counters.workersCreated, detail).toBe(0);
	});
});

test.describe("SS-10619 unchanged behavior", () => {
	test("without KHR_parallel_shader_compile the map loads and lights the scene", async ({
		page,
	}) => {
		await setup(page, {parallel: false});
		await showBox(page);
		const {result} = await load(page, HDR.a.url, pixels(HDR.a));
		expect(result.status).toBe("end");
		const hash = await page.evaluate(() =>
			(window as any).__perf.env.mapHash(),
		);
		expect(hash).not.toBeNull();
		expect(hash.nonZero).toBeGreaterThan(0);
	});

	test("one .hdr load gives one start and one end event", async ({page}) => {
		await setup(page);
		const {result} = await load(page, HDR.a.url, pixels(HDR.a));
		expect(result).toEqual({status: "end", starts: 1, ends: 1, cancels: 0});
	});
});
