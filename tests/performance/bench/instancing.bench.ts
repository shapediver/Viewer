import {test, type Browser, type CDPSession, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {
	describeInstancingLoad,
	prefetchInstancingGlb,
	routeInstancingGlbs,
	startInstancingLoad,
} from "../fixtures/instancingGlbs";
import {openViewer} from "../fixtures/probe";
import {
	cpuOf,
	interval,
	median,
	ms,
	pairedChange,
	quantile,
	verdict,
} from "./paired";

// The two servers playwright.config.ts starts.
const BASE_URL = "http://127.0.0.1:8195";
const HEAD_URL = "http://127.0.0.1:8196";

/**
 * Times glb loads with GPU-instancing detection on files whose meshes all
 * share vertex count, index count and material, for two builds of
 * examples/test-cdn. Same method as timing.bench.ts: base, head and control
 * (base again) side by side, main-thread CPU time, paired ratios with a 95%
 * confidence interval, and control against base as the noise floor. The
 * output is a Markdown table. Nothing is asserted. See README.md.
 */

const ROUNDS = Number(process.env.BENCH_RUNS ?? 6);
/** Loads per page and file in one round. A 3000-mesh load takes seconds. */
const BLOCKS = 2;
const OUT_DIR = path.join(__dirname, "../../test-results/bench");

const ARMS = {base: BASE_URL, head: HEAD_URL, control: BASE_URL} as const;
type Arm = keyof typeof ARMS;
const ORDERS: Arm[][] = [
	["base", "head", "control"],
	["head", "control", "base"],
	["control", "base", "head"],
	["base", "control", "head"],
	["head", "base", "control"],
	["control", "head", "base"],
];

/** The distinct pair shows the growth; the 3000-mesh files the cost. */
const FILES = ["distinct-750", "distinct-3000", "jitter-3000", "near-3000"];

type Clock = "cpu" | "wall";
type Blocks = Record<Clock, number[]>;
type Sample = Record<string, Blocks>;

interface Loader {
	page: Page;
	cdp: CDPSession;
}

/** A page without a viewport: nothing draws, the load is the only work. */
async function open(browser: Browser, origin: string): Promise<Loader> {
	const page = await browser.newPage();
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Performance.enable", {timeDomain: "threadTicks"});
	await openViewer(page, `${origin}/index.html`);
	await routeInstancingGlbs(page);
	for (const file of FILES) await prefetchInstancingGlb(page, file);
	return {page, cdp};
}

/**
 * One load from a prefetched blob URL. The CPU clock runs around
 * `loadContent` only; the result walk afterwards is outside it.
 */
async function load(loader: Loader, name: string) {
	const {cpu, result} = await cpuOf(loader.cdp, () =>
		startInstancingLoad(loader.page, name, false),
	);
	await describeInstancingLoad(loader.page);
	return {cpu, wall: result.ms};
}

async function round(browser: Browser, index: number) {
	const loaders = {} as Record<Arm, Loader>;
	const order = ORDERS[index % ORDERS.length];
	for (const arm of order) loaders[arm] = await open(browser, ARMS[arm]);
	// Uncounted first load per page: one-time setup of the loaders.
	for (const arm of order) await load(loaders[arm], FILES[0]);

	const result = {} as Record<Arm, Sample>;
	for (const arm of order) result[arm] = {};
	let turn = index;
	for (const file of FILES) {
		for (const arm of order) result[arm][file] = {cpu: [], wall: []};
		for (let block = 0; block < BLOCKS; block++)
			for (const arm of ORDERS[turn++ % ORDERS.length]) {
				const value = await load(loaders[arm], file);
				result[arm][file].cpu.push(value.cpu);
				result[arm][file].wall.push(value.wall);
			}
	}
	for (const arm of order) await loaders[arm].page.close();
	return result;
}

function table(samples: Record<Arm, Sample[]>, clock: Clock, main: boolean) {
	const lines = [
		`| File | Base median (min) | Head median (min) | Head vs base (95% CI) |${main ? " Verdict |" : ""} A/A: control vs base (95% CI) |`,
		`| --- | ---: | ---: | ---: |${main ? " --- |" : ""} ---: |`,
	];
	for (const file of FILES) {
		const blocks = (arm: Arm) =>
			samples[arm].map((sample) => sample[file][clock]);
		const cell = (arm: Arm) => {
			const perRound = blocks(arm).map(median);
			return `${ms(median(perRound))} (${ms(quantile(perRound, 0))})`;
		};
		const change = pairedChange(blocks("base"), blocks("head"));
		const noise = pairedChange(blocks("base"), blocks("control"));
		lines.push(
			`| ${file} | ${cell("base")} | ${cell("head")} | ${interval(change)} |${main ? ` ${verdict(change)} |` : ""} ${interval(noise)} |`,
		);
	}
	return lines;
}

/** Median CPU time of the 3000-mesh distinct load over the 750-mesh one. */
function growth(samples: Sample[]) {
	const of = (file: string) =>
		median(samples.map((sample) => median(sample[file].cpu)));
	return (of("distinct-3000") / of("distinct-750")).toFixed(1) + "x";
}

function report(samples: Record<Arm, Sample[]>) {
	return (
		[
			"# GPU-instancing detection timing benchmark",
			"",
			"- Fixture: synthetic glb files, every mesh 64 vertices, same index count and material (`fixtures/instancingGlbs.ts`)",
			`- Rounds: ${ROUNDS}, ${BLOCKS} loads per page and file. Each round opens base, head and control (base again) side by side and alternates between them load by load.`,
			`- Base: ${process.env.BENCH_BASE ?? "examples/test-cdn/dist"}`,
			`- Head: ${process.env.BENCH_HEAD ?? "examples/test-cdn/dist"}`,
			"",
			"Milliseconds of `DataEngine.loadContent`. Base and head: median over the rounds, the fastest round in brackets.",
			"Head vs base: geometric mean of the per-round ratios with a 95% confidence interval. An interval that contains 0 is not distinguishable from noise.",
			"A/A compares two pages of the base build. It is this run's noise floor; its interval should contain 0. If it does not, the machine was too busy: run again.",
			"",
			"Main-thread CPU time:",
			"",
			...table(samples, "cpu", true),
			"",
			`Growth of the distinct load from 750 to 3000 meshes (4x the meshes; linear 4x, quadratic 16x), CPU time: base ${growth(samples.base)}, head ${growth(samples.head)}, control ${growth(samples.control)}.`,
			"",
			"The same runs on the wall clock, for reference:",
			"",
			...table(samples, "wall", false),
		].join("\n") + "\n"
	);
}

test("benchmark: base against head, GPU-instancing detection", async ({
	browser,
}) => {
	const samples: Record<Arm, Sample[]> = {base: [], head: [], control: []};
	for (let index = 0; index < ROUNDS; index++) {
		const result = await round(browser, index);
		for (const arm of Object.keys(samples) as Arm[])
			samples[arm].push(result[arm]);
		console.log(`Round ${index + 1} of ${ROUNDS} done`);
	}
	const markdown = report(samples);
	fs.mkdirSync(OUT_DIR, {recursive: true});
	fs.writeFileSync(path.join(OUT_DIR, "instancing-report.md"), markdown);
	fs.writeFileSync(
		path.join(OUT_DIR, "instancing-samples.json"),
		JSON.stringify(samples, null, "\t"),
	);
	console.log("\n" + markdown);
});
