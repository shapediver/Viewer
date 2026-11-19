import {test, type Browser} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {aecSceneCounts} from "../fixtures/aecScene";
import {
	describeInstancingLoad,
	INSTANCING_FILES,
	INSTANCING_KINDS,
	INSTANCING_SIZES,
	prefetchInstancingGlb,
	routeInstancingGlbs,
	startInstancingLoad,
	type InstancingResult,
} from "../fixtures/instancingGlbs";
import {openViewer} from "../fixtures/probe";
import {ALL_SECTIONS, type Section} from "./count";
import {
	COUNTERS,
	installCountHarness,
	open,
	SCENE,
	type Counter,
	type Counts,
} from "./count/context";

/**
 * Counts the work two builds of examples/test-cdn do on the AEC fixture:
 * JavaScript function calls and executed blocks of the viewer bundle (V8
 * precise coverage) and WebGL calls. Unlike time, a count does not depend on
 * what else runs on the machine. The output is a Markdown table per
 * section. Nothing is asserted. See README.md.
 * The sections are in `count/`, one file each, listed in `count/index.ts`.
 */

const BASE_URL = `http://127.0.0.1:${process.env.COUNT_BASE_PORT ?? 8197}`;
const HEAD_URL = `http://127.0.0.1:${process.env.COUNT_HEAD_PORT ?? 8198}`;
/** Pages per build. Every page must give the same counts. */
const PAGES = Number(process.env.COUNT_PAGES ?? 2);
const OUT_DIR = path.join(__dirname, "../../test-results/bench");
/** COUNT_ATTRIBUTES=1 adds the attribute switch, on a smaller tower. */
const ATTRIBUTES = process.env.COUNT_ATTRIBUTES === "1";

const SECTIONS = ALL_SECTIONS.filter(
	([section]) => ATTRIBUTES || section !== "attributeSwitch",
);

type PageCounts = Record<Section, Counts>;

/** One page: every section in order. */
async function measure(browser: Browser, origin: string) {
	const viewer = await open(browser, origin);
	const result = {} as PageCounts;
	for (const [section, , run, ownPage] of SECTIONS)
		if (!ownPage) result[section] = await run(viewer);
	const gpu = viewer.gpu;
	await viewer.page.close();
	// Sections with a page of their own, after the shared page is closed.
	for (const [section, , run, ownPage] of SECTIONS) {
		if (!ownPage) continue;
		const own = await open(browser, origin);
		result[section] = await run(own);
		await own.page.close();
	}
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
	const counts = aecSceneCounts(SCENE);
	const lines = [
		"# Viewer work-count benchmark",
		"",
		`- Fixture: AEC facade, ${counts.meshes} meshes, ${counts.treeNodes} tree nodes${SCENE.glassBlend ? ", blended glass" : ""}`,
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

/**
 * Bundle functions of GPU-instancing detection, counted by name. Class
 * method names survive the bundle's minification. `couldBeRigidCopy` runs
 * once per pair of primitives that is tested at all; the two `tryExtract`
 * functions walk the vertices of a candidate pair.
 */
const DETECTION_COUNTERS = [
	["calls", "JS function calls", []],
	["blocks", "JS executed blocks", []],
	["rigidTests", "Rigid-copy tests (couldBeRigidCopy)", ["couldBeRigidCopy"]],
	[
		"vertexWalks",
		"Vertex walks (tryExtractBaked*)",
		["tryExtractBakedTranslation", "tryExtractBakedInstance"],
	],
] as const;
type DetectionCounter = (typeof DETECTION_COUNTERS)[number][0];
type LoadCounts = Record<DetectionCounter, number> & InstancingResult;
type InstancingPage = Record<string, LoadCounts>;

/**
 * One page without a viewport: nothing draws. Each file is fetched into a
 * blob URL first, so the network stays out of the section. The load is
 * asynchronous but uses no timers, so timers and animation frames are held
 * as in `count`, and `performance.now` is frozen (see below). The coverage
 * counters are reset right before the load and read right after it, before
 * the result is described.
 */
async function measureInstancing(browser: Browser, origin: string) {
	const page = await browser.newPage();
	await page.addInitScript(installCountHarness);
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Profiler.enable");
	await cdp.send("Profiler.startPreciseCoverage", {
		callCount: true,
		detailed: true,
	});
	await openViewer(page, `${origin}/index.html`);
	await routeInstancingGlbs(page);
	for (const file of INSTANCING_FILES)
		await prefetchInstancingGlb(page, file.name);
	// Uncounted first load: one-time setup of the loaders.
	await startInstancingLoad(page, INSTANCING_FILES[0].name, false);
	await describeInstancingLoad(page);

	const result: InstancingPage = {};
	for (const file of INSTANCING_FILES) {
		// GLTFLoader emits a progress event whenever enough time has passed
		// since the last one, so the number of events (31 calls each)
		// followed the load time. A frozen clock emits none.
		await page.evaluate(() => {
			(window as any).__count.hold();
			const now = performance.now();
			(window as any).__realNow = performance.now;
			performance.now = () => now;
		});
		await cdp.send("Profiler.takePreciseCoverage");
		await startInstancingLoad(page, file.name, false);
		const {result: coverage} = await cdp.send(
			"Profiler.takePreciseCoverage",
		);
		await page.evaluate(() => {
			performance.now = (window as any).__realNow;
			(window as any).__count.release();
		});
		const counts = {
			calls: 0,
			blocks: 0,
			rigidTests: 0,
			vertexWalks: 0,
		} as Record<DetectionCounter, number>;
		const perFunction: Record<number, number> = {};
		for (const script of coverage) {
			if (!script.url.startsWith(origin)) continue;
			for (const fn of script.functions) {
				const first = fn.ranges[0];
				if (!first || first.count === 0) continue;
				perFunction[first.startOffset] = first.count;
				counts.calls += first.count;
				for (const range of fn.ranges) counts.blocks += range.count;
				for (const [counter, , names] of DETECTION_COUNTERS)
					if ((names as readonly string[]).includes(fn.functionName))
						counts[counter] += first.count;
			}
		}
		if (process.env.COUNT_DUMP)
			fs.appendFileSync(
				process.env.COUNT_DUMP,
				JSON.stringify({origin, section: file.name, perFunction}) +
					"\n",
			);
		result[file.name] = {
			...counts,
			...(await describeInstancingLoad(page)),
		};
	}
	await page.close();
	return result;
}

function instancingReport(base: InstancingPage[], head: InstancingPage[]) {
	const agree = (pages: InstancingPage[], file: string, key: string) =>
		pages.every(
			(page) => (page[file] as any)[key] === (pages[0][file] as any)[key],
		);
	const lines = [
		"# Work count: GPU-instancing detection",
		"",
		"- Fixture: synthetic glb files, every mesh 64 vertices, same index count and material (`fixtures/instancingGlbs.ts`)",
		`- Pages: ${PAGES} per build. Base and head columns show the first page; "Pages agree" compares all of them.`,
		`- Base: ${process.env.BENCH_BASE ?? "examples/test-cdn/dist"}`,
		`- Head: ${process.env.BENCH_HEAD ?? "examples/test-cdn/dist"}`,
		"",
		"Counts of one `DataEngine.loadContent` per file. Same detection result: every page of both builds gives the same instance groups and offset matrices.",
	];
	for (const file of INSTANCING_FILES) {
		const same = [...base, ...head].every(
			(page) =>
				page[file.name].resultHash === base[0][file.name].resultHash,
		);
		lines.push(
			"",
			`## ${file.name} (${file.meshes} meshes, ${base[0][file.name].instanceGroups} instance groups, same detection result: ${same ? "yes" : "NO"})`,
			"",
			"| Counter | Base | Head | Head - base | Change | Pages agree (base / head) |",
			"| --- | ---: | ---: | ---: | ---: | --- |",
		);
		for (const [counter, label] of DETECTION_COUNTERS) {
			const a = base[0][file.name][counter];
			const b = head[0][file.name][counter];
			lines.push(
				`| ${label} | ${number(a)} | ${number(b)} | ${signed(b - a)} | ${a ? percent((b - a) / a) : "-"} | ${agree(base, file.name, counter) ? "yes" : "no"} / ${agree(head, file.name, counter) ? "yes" : "no"} |`,
			);
		}
	}
	const [small, large] = INSTANCING_SIZES;
	lines.push(
		"",
		`## Growth from ${small} to ${large} meshes`,
		"",
		`${large / small}x the meshes: linear work grows ${large / small}x, quadratic ${(large / small) ** 2}x.`,
		"",
		"| Kind | Counter | Base | Head |",
		"| --- | --- | ---: | ---: |",
	);
	for (const kind of INSTANCING_KINDS)
		for (const [counter, label] of DETECTION_COUNTERS) {
			const growth = (pages: InstancingPage[]) => {
				const a = pages[0][`${kind}-${small}`][counter];
				const b = pages[0][`${kind}-${large}`][counter];
				return a ? `${(b / a).toFixed(1)}x` : "-";
			};
			lines.push(
				`| ${kind} | ${label} | ${growth(base)} | ${growth(head)} |`,
			);
		}
	return lines.join("\n") + "\n";
}

test("work count: base against head, GPU-instancing detection", async ({
	browser,
}) => {
	const base: InstancingPage[] = [];
	const head: InstancingPage[] = [];
	for (let index = 0; index < PAGES; index++) {
		for (const [origin, pages] of [
			[BASE_URL, base],
			[HEAD_URL, head],
		] as const) {
			pages.push(await measureInstancing(browser, origin));
			console.log(
				`${origin === BASE_URL ? "base" : "head"} page ${index + 1}: ${JSON.stringify(pages[pages.length - 1])}`,
			);
		}
	}
	const markdown = instancingReport(base, head);
	fs.mkdirSync(OUT_DIR, {recursive: true});
	fs.writeFileSync(path.join(OUT_DIR, "work-count-instancing.md"), markdown);
	fs.writeFileSync(
		path.join(OUT_DIR, "work-count-instancing.json"),
		JSON.stringify({base, head}, null, "\t"),
	);
	console.log("\n" + markdown);
});
