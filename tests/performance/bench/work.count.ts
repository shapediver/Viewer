import {test, type Browser, type CDPSession, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {AEC_DEFAULT, aecSceneCounts} from "../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../fixtures/probe";

/**
 * Counts the work two builds of examples/test-cdn do on the AEC fixture:
 * JavaScript function calls and executed blocks of the viewer bundle (V8
 * precise coverage) and WebGL calls. Unlike time, a count does not depend on
 * what else runs on the machine. The output is a Markdown table per
 * section. Nothing is asserted. See README.md.
 */

const BASE_URL = `http://127.0.0.1:${process.env.COUNT_BASE_PORT ?? 8197}`;
const HEAD_URL = `http://127.0.0.1:${process.env.COUNT_HEAD_PORT ?? 8198}`;
/** Pages per build. Every page must give the same counts. */
const PAGES = Number(process.env.COUNT_PAGES ?? 2);
const OUT_DIR = path.join(__dirname, "../../test-results/bench");
const VARIANT: SceneVariant = {id: "default", shadows: true, ssao: false};
const RENDERS = 2;
/** Even, so the section leaves the scene as it found it. */
const UPDATES = 4;
const SSAO_FRAMES = 2;

const SECTIONS = [
	["build", "Full scene build (tree + viewport.update)"],
	["renderFrame", `Camera frame, renderer.render x${RENDERS}`],
	["oneNodeUpdate", `One-node scene update x${UPDATES}`],
	[
		"ssaoFrame",
		`Camera frame with SSAO, post-processing render x${SSAO_FRAMES}`,
	],
] as const;
type Section = (typeof SECTIONS)[number][0];

const COUNTERS = [
	["calls", "JS function calls"],
	["blocks", "JS executed blocks"],
	["functions", "JS functions run"],
	["gl", "WebGL calls"],
	["draws", "WebGL draw calls"],
] as const;
type Counter = (typeof COUNTERS)[number][0];
type Counts = Record<Counter, number>;
type PageCounts = Record<Section, Counts>;

/**
 * Runs in the page before any of its scripts. Makes the page repeatable and
 * lets the benchmark stop everything that is not the measured section:
 * - `Math.random` is a seeded generator, so random ids and anything sorted
 *   or hashed by them come out the same on every page.
 * - Callbacks of `requestAnimationFrame`, `setTimeout` and `setInterval`
 *   that come due while `hold` is set are queued and run on `release`.
 * It must not reference anything outside its own body.
 */
function installCountHarness() {
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
		},
		resetGl() {
			gl.calls = 0;
			gl.draws = 0;
		},
		gl: () => ({...gl}),
	};
}

interface Viewer {
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
async function settle(viewer: Viewer) {
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
async function count(
	viewer: Viewer,
	section: Section,
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

async function open(browser: Browser, origin: string): Promise<Viewer> {
	const page = await browser.newPage();
	await page.addInitScript(installCountHarness);
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Profiler.enable");
	await cdp.send("Profiler.startPreciseCoverage", {
		callCount: true,
		detailed: true,
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

/** One page: every section in order. */
async function measure(browser: Browser, origin: string) {
	const viewer = await open(browser, origin);
	const result = {} as PageCounts;
	result.build = await count(
		viewer,
		"build",
		(options) => (window as any).__probe.build(options),
		AEC_DEFAULT,
	);
	await viewer.page.evaluate(
		(variant) => (window as any).__probe.show(variant),
		VARIANT,
	);
	result.renderFrame = await count(
		viewer,
		"renderFrame",
		(renders) => {
			const probe = (window as any).__probe;
			const camera = probe.viewport.threeJsCoreObjects.camera;
			for (let i = 0; i < renders; i++)
				probe.renderer.render(probe.scene, camera);
		},
		RENDERS,
		true,
	);
	result.oneNodeUpdate = await count(
		viewer,
		"oneNodeUpdate",
		(updates) => {
			const probe = (window as any).__probe;
			for (let i = 0; i < updates; i++) probe.timeOneNodeChange();
		},
		UPDATES,
	);
	await viewer.page.evaluate(() => (window as any).__probe.addSsao());
	result.ssaoFrame = await count(
		viewer,
		"ssaoFrame",
		(frames) => {
			const probe = (window as any).__probe;
			const composer = probe.viewport.postProcessing.effectComposer;
			const renderer = probe.renderer;
			const camera = probe.viewport.threeJsCoreObjects.camera;
			if (!composer)
				throw new Error("SSAO did not create an effect composer");
			// What PostProcessingManager.render does around the composer,
			// without the clear colour (only visible in the image).
			const toneMapping = renderer.toneMapping;
			renderer.toneMapping = 0; // THREE.NoToneMapping
			renderer.autoClear = false;
			composer.setMainCamera(camera);
			for (let i = 0; i < frames; i++) composer.render();
			renderer.toneMapping = toneMapping;
			renderer.autoClear = true;
		},
		SSAO_FRAMES,
		true,
	);
	const gpu = viewer.gpu;
	await viewer.page.close();
	return {gpu, counts: result};
}

const number = (value: number) =>
	Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "-";
const signed = (value: number) => `${value > 0 ? "+" : ""}${number(value)}`;
const percent = (value: number) =>
	Number.isFinite(value)
		? `${value > 0 ? "+" : ""}${(value * 100).toFixed(2)}%`
		: "-";

/** "yes" when every page of a build gave the same count, else the range. */
function agreement(pages: PageCounts[], section: Section, counter: Counter) {
	const values = pages.map((page) => page[section][counter]);
	const low = Math.min(...values);
	const high = Math.max(...values);
	return low === high ? "yes" : `no: ${number(low)} to ${number(high)}`;
}

function table(
	base: PageCounts[],
	head: PageCounts[],
	section: Section,
): string[] {
	const lines = [
		"| Counter | Base | Head | Head - base | Change | Pages agree (base / head) |",
		"| --- | ---: | ---: | ---: | ---: | --- |",
	];
	for (const [counter, label] of COUNTERS) {
		const a = base[0][section][counter];
		const b = head[0][section][counter];
		lines.push(
			`| ${label} | ${number(a)} | ${number(b)} | ${signed(b - a)} | ${a ? percent((b - a) / a) : "-"} | ${agreement(base, section, counter)} / ${agreement(head, section, counter)} |`,
		);
	}
	return lines;
}

function report(base: PageCounts[], head: PageCounts[], gpu: string) {
	const counts = aecSceneCounts(AEC_DEFAULT);
	const lines = [
		"# Viewer work-count benchmark",
		"",
		`- Fixture: AEC facade, ${counts.meshes} meshes, ${counts.treeNodes} tree nodes`,
		`- Pages: ${PAGES} per build, one after the other. Base and head columns show the first page; "Pages agree" compares all of them.`,
		`- GPU: ${gpu}`,
		`- Base: ${process.env.BENCH_BASE ?? "examples/test-cdn/dist"}`,
		`- Head: ${process.env.BENCH_HEAD ?? "examples/test-cdn/dist"}`,
		"",
		"JS counts cover the viewer bundle only, from V8 precise coverage. WebGL calls count every method call on the viewer's context. A count is the same on every run, idle or loaded; it does not show time. See README.md.",
	];
	for (const [section, label] of SECTIONS)
		lines.push("", `## ${label}`, "", ...table(base, head, section));
	return lines.join("\n") + "\n";
}

test("work count: base against head on the AEC facade", async ({browser}) => {
	const base: PageCounts[] = [];
	const head: PageCounts[] = [];
	let gpu = "unknown";
	// Alternate the builds, so a change on the machine during the run would
	// hit both.
	for (let index = 0; index < PAGES; index++) {
		for (const [origin, pages] of [
			[BASE_URL, base],
			[HEAD_URL, head],
		] as const) {
			const result = await measure(browser, origin);
			gpu = result.gpu;
			pages.push(result.counts);
			console.log(
				`${origin === BASE_URL ? "base" : "head"} page ${index + 1}: ${JSON.stringify(result.counts)}`,
			);
		}
	}

	const markdown = report(base, head, gpu);
	fs.mkdirSync(OUT_DIR, {recursive: true});
	fs.writeFileSync(path.join(OUT_DIR, "work-count.md"), markdown);
	fs.writeFileSync(
		path.join(OUT_DIR, "work-count.json"),
		JSON.stringify({base, head}, null, "\t"),
	);
	console.log("\n" + markdown);
});
