import type {Browser, CDPSession, Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {AEC_DEFAULT} from "../../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../../fixtures/probe";
import {syntheticGlb} from "../../syntheticGlb";

/**
 * What every section of the work-count benchmark shares: the fixture, the
 * in-page harness, the coverage counter (`count`) and how a page is opened.
 * A section is one file next to this one, listed in `index.ts`.
 */

export const VARIANT: SceneVariant = {
	id: "default",
	shadows: true,
	ssao: false,
};
/** BENCH_GLASS_BLEND=1: the glass is glTF BLEND (transparent, no depth write). */
export const SCENE = {
	...AEC_DEFAULT,
	glassBlend: process.env.BENCH_GLASS_BLEND === "1",
};
/** The attribute switch runs on a smaller tower (COUNT_ATTRIBUTES=1). */
export const ATTRIBUTE_SCENE = {...SCENE, floors: 1};
/** Files for the glTF load sections, served from memory by a route. */
const ASSET_HOST = "https://count-assets.viewertests.invalid";
const ASSETS_DIR = path.join(__dirname, "../../assets");
// Shaped like ShapeDiverGltfV2Writer output, facade-sized (1,249 nodes).
const PLAIN_GLB = syntheticGlb({
	meshes: 312,
	instancesPerMesh: 3,
	gridSize: 8,
	jitter: true,
});
export const PLAIN_GLB_HREF = `${ASSET_HOST}/plain.glb`;
export const DRACO_GLTF_HREF = `${ASSET_HOST}/Box.gltf`;

export const COUNTERS = [
	["calls", "JS function calls"],
	["blocks", "JS executed blocks"],
	["functions", "JS functions run"],
	["gl", "WebGL calls"],
	["draws", "WebGL draw calls"],
] as const;
export type Counter = (typeof COUNTERS)[number][0];
export type Counts = Record<Counter, number>;

/**
 * Runs in the page before any of its scripts. Makes the page repeatable and
 * lets the benchmark stop everything that is not the measured section:
 * - `Math.random` is a seeded generator, so random ids and anything sorted
 *   or hashed by them come out the same on every page.
 * - Callbacks of `requestAnimationFrame`, `setTimeout` and `setInterval`
 *   that come due while `hold` is set are queued and run on `release`.
 * It must not reference anything outside its own body.
 */
export function installCountHarness() {
	let seed = 0x2545f491;
	Math.random = () => {
		// mulberry32
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	const queued: (() => void)[] = [];
	let hold = false;
	const deferred = (callback: (...args: any[]) => void) =>
		function (this: unknown, ...args: any[]) {
			if (hold) {
				queued.push(() => callback.apply(this, args));
				return;
			}
			callback.apply(this, args);
		};
	const raf = window.requestAnimationFrame.bind(window);
	window.requestAnimationFrame = (callback) => raf(deferred(callback));
	const timeout = window.setTimeout.bind(window);
	(window as any).setTimeout = (handler: any, ms?: number, ...args: any[]) =>
		typeof handler === "function"
			? timeout(deferred(handler), ms, ...args)
			: timeout(handler, ms, ...args);
	const interval = window.setInterval.bind(window);
	(window as any).setInterval = (
		handler: any,
		ms?: number,
		...args: any[]
	) =>
		typeof handler === "function"
			? interval(deferred(handler), ms, ...args)
			: interval(handler, ms, ...args);

	const DRAWS = new Set([
		"drawArrays",
		"drawElements",
		"drawArraysInstanced",
		"drawElementsInstanced",
		"drawRangeElements",
	]);
	const gl = {calls: 0, draws: 0};

	(window as any).__count = {
		hold() {
			hold = true;
		},
		release() {
			hold = false;
			queued.splice(0).forEach((run) => run());
		},
		queued: () => queued.length,
		/** Counts every call on this context from now on. */
		wrapContext(context: any) {
			const proto = Object.getPrototypeOf(context);
			for (const key of Object.getOwnPropertyNames(proto)) {
				const descriptor = Object.getOwnPropertyDescriptor(proto, key)!;
				if (
					typeof descriptor.value !== "function" ||
					key === "constructor"
				)
					continue;
				const original = descriptor.value;
				const draw = DRAWS.has(key) || key.startsWith("multiDraw");
				context[key] = function (...args: unknown[]) {
					gl.calls++;
					if (draw) gl.draws++;
					return original.apply(this, args);
				};
			}
			// three.js draws a BatchedMesh through this extension, not the
			// context. getExtension returns the same object every time, so
			// the one three.js already holds is wrapped here.
			const multiDraw = context.getExtension("WEBGL_multi_draw");
			if (!multiDraw) return;
			for (const key of Object.getOwnPropertyNames(
				Object.getPrototypeOf(multiDraw),
			)) {
				const original = multiDraw[key];
				if (typeof original !== "function" || key === "constructor")
					continue;
				multiDraw[key] = function (...args: unknown[]) {
					gl.calls++;
					if (key.startsWith("multiDraw")) gl.draws++;
					return original.apply(this, args);
				};
			}
		},
		resetGl() {
			gl.calls = 0;
			gl.draws = 0;
		},
		gl: () => ({...gl}),
	};
}

export interface Viewer {
	page: Page;
	cdp: CDPSession;
	origin: string;
	gpu: string;
}

/**
 * Waits until the viewer has drawn nothing for 10 frames: the first frames,
 * a beauty render or the redraw after an update are over, so every page
 * starts the section in the same state.
 */
export async function settle(viewer: Viewer) {
	const settled = await viewer.page.evaluate(async () => {
		const probe = (window as any).__probe;
		const frame = () =>
			new Promise((resolve) => requestAnimationFrame(resolve));
		const start = performance.now();
		let quiet = 0;
		let seen = probe.passes.length;
		while (quiet < 10) {
			if (performance.now() - start > 120_000) return false;
			await frame();
			if (probe.passes.length === seen) quiet++;
			else [quiet, seen] = [0, probe.passes.length];
		}
		probe.reset();
		return true;
	});
	if (!settled) throw new Error("The viewer did not stop drawing");
}

/**
 * Counts the work of `run`, which must be synchronous. Animation frames and
 * timers are held from before the first coverage read until after the
 * second, so only the section and the evaluate calls around it run.
 *
 * With `warmUp`, `run` runs once more before counting, inside the hold. A
 * frame can create a texture or material the first time it needs it, and
 * whether the viewer's own frames before the section already did depends on
 * timing (how many frames the beauty render took). After one uncounted run
 * it is there on every page.
 */
export async function count(
	viewer: Viewer,
	section: string,
	run: (arg: any) => unknown,
	arg?: unknown,
	warmUp = false,
): Promise<Counts> {
	const {page, cdp, origin} = viewer;
	await settle(viewer);
	await page.evaluate(() => (window as any).__count.hold());
	if (warmUp) await page.evaluate(run, arg);
	// Reading the coverage resets the counters.
	await cdp.send("Profiler.takePreciseCoverage");
	await page.evaluate(() => (window as any).__count.resetGl());
	await page.evaluate(run, arg);
	const {result} = await cdp.send("Profiler.takePreciseCoverage");
	const gl = await page.evaluate(() => (window as any).__count.gl());
	await page.evaluate(() => (window as any).__count.release());

	// Only the viewer bundle. The fixture, the probe and Playwright's own
	// scripts are evaluated scripts without a URL from the page's origin.
	let calls = 0;
	let blocks = 0;
	let functions = 0;
	/** Calls per function, keyed by its offset in the bundle. */
	const perFunction: Record<number, number> = {};
	for (const script of result) {
		if (!script.url.startsWith(origin)) continue;
		for (const fn of script.functions) {
			const first = fn.ranges[0];
			if (!first || first.count === 0) continue;
			perFunction[first.startOffset] = first.count;
			functions++;
			calls += first.count;
			for (const range of fn.ranges) blocks += range.count;
		}
	}
	// For finding the functions behind a difference: one line per section
	// and page. Map an offset to source with the build's bundle.js.map.
	if (process.env.COUNT_DUMP)
		fs.appendFileSync(
			process.env.COUNT_DUMP,
			JSON.stringify({origin, section, perFunction}) + "\n",
		);
	return {calls, blocks, functions, gl: gl.calls, draws: gl.draws};
}

export async function open(browser: Browser, origin: string): Promise<Viewer> {
	const page = await browser.newPage();
	await page.addInitScript(installCountHarness);
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Profiler.enable");
	await cdp.send("Profiler.startPreciseCoverage", {
		callCount: true,
		detailed: true,
	});
	await page.route(`${ASSET_HOST}/**`, async (route) => {
		const name = path.basename(new URL(route.request().url()).pathname);
		if (name === "plain.glb")
			return route.fulfill({
				status: 200,
				contentType: "model/gltf-binary",
				body: PLAIN_GLB,
			});
		const file = path.join(ASSETS_DIR, name);
		if (!fs.existsSync(file)) return route.fulfill({status: 404});
		await route.fulfill({status: 200, body: fs.readFileSync(file)});
	});
	await openViewer(page, `${origin}/index.html`);
	const gpu: string = await page.evaluate(async (variant) => {
		const probe = (window as any).__probe;
		const gpu = await probe.createViewport(variant);
		(window as any).__count.wrapContext(probe.gl);
		return gpu;
	}, VARIANT);
	return {page, cdp, origin, gpu};
}

/**
 * Loads a file and resolves when the tree is converted. It is not added
 * to the scene, so nothing is drawn. Work in a worker is not counted:
 * only scripts of the build's origin are, and a worker from a blob URL
 * has none. performance.now() stands still during the load: the loader's
 * progress events (every 500 ms) and time-sliced yields would otherwise
 * make the count depend on the speed of the machine. Runs in the page.
 */
export const loadContent = (file: {format: string; href: string}) => {
	const now = performance.now;
	const frozen = now.call(performance);
	performance.now = () => frozen;
	return (window as any).SDV.DataEngine.instance
		.loadContent(file)
		.then(() => undefined)
		.finally(() => (performance.now = now));
};
