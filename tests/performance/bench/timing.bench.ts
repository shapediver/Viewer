import {test, type Browser} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {aecSceneCounts} from "../fixtures/aecScene";
import {openViewer} from "../fixtures/probe";
import {interval, median, ms, pairedChange, quantile, verdict} from "./paired";
import {METRICS, STEPS, type Metric} from "./timing";
import {closeUp} from "./timing/aoFrame";
import {build} from "./timing/build";
import {SCENE, settle, VARIANT, type Clock, type Viewer} from "./timing/common";
import {firstFrame} from "./timing/firstFrame";

// The two servers playwright.config.ts starts.
const BASE_URL = "http://127.0.0.1:8195";
const HEAD_URL = "http://127.0.0.1:8196";

/**
 * Compares two builds of examples/test-cdn on the AEC fixture.
 * The output is a Markdown table. Nothing is asserted. See README.md.
 * The metrics are in `timing/`, one file each, listed in `timing/index.ts`.
 */

const ROUNDS = Number(process.env.BENCH_RUNS ?? 6);
const OUT_DIR = path.join(__dirname, "../../test-results/bench");

/**
 * Every round opens base, head and control side by side. Control is the
 * base build again: base against control is an A/A comparison, the noise
 * floor of this run. The order rotates from block to block and round to
 * round, so no build is always measured first.
 */
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

/** One value per block, for each clock. Build and first frame have one block. */
type Blocks = Record<Clock, number[]>;
type Sample = Record<Metric, Blocks> & {gpu: string};

async function open(browser: Browser, origin: string): Promise<Viewer> {
	const page = await browser.newPage();
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Performance.enable", {timeDomain: "threadTicks"});
	await openViewer(page, `${origin}/index.html`);
	const gpu: string = await page.evaluate(
		(variant) => (window as any).__probe.createViewport(variant),
		VARIANT,
	);
	return {page, cdp, gpu};
}

/** One round: all three pages, every metric, blocks alternating between pages. */
async function round(browser: Browser, index: number) {
	const viewers = {} as Record<Arm, Viewer>;
	const order = ORDERS[index % ORDERS.length];
	for (const arm of order) viewers[arm] = await open(browser, ARMS[arm]);
	const result = {} as Record<Arm, Sample>;
	for (const arm of order) result[arm] = {gpu: viewers[arm].gpu} as Sample;

	let turn = index;
	for (const [metric, step, blocks] of STEPS) {
		if (metric === "composerFrame")
			for (const arm of order) {
				await viewers[arm].page.evaluate(() =>
					(window as any).__probe.addSsao(),
				);
				await settle(viewers[arm]);
			}
		if (metric === "aoFrame")
			for (const arm of order) await closeUp(viewers[arm]);
		for (const arm of order) result[arm][metric] = {cpu: [], wall: []};
		for (let block = 0; block < blocks; block++) {
			for (const arm of ORDERS[turn++ % ORDERS.length]) {
				const value = await step(viewers[arm]);
				result[arm][metric].cpu.push(value.cpu);
				result[arm][metric].wall.push(value.wall);
			}
		}
	}
	for (const arm of order) await viewers[arm].page.close();
	return result;
}

const CLOCK_LABEL: Record<Clock, string> = {
	cpu: "main-thread CPU",
	wall: "wall",
};

/**
 * The main table uses each metric's main clock and gives a verdict. The
 * reference table shows the other clock without one: ten intervals per
 * report would give a false verdict by chance about every other run.
 */
function table(samples: Record<Arm, Sample[]>, primary: boolean) {
	const lines = [
		`| Metric | Clock | Base median (min) | Head median (min) | Head vs base (95% CI) |${primary ? " Verdict |" : ""} A/A: control vs base (95% CI) |`,
		`| --- | --- | ---: | ---: | ---: |${primary ? " --- |" : ""} ---: |`,
	];
	for (const [metric, label, main] of METRICS) {
		const clock: Clock = primary ? main : main === "cpu" ? "wall" : "cpu";
		const blocks = (arm: Arm) =>
			samples[arm].map((sample) => sample[metric][clock]);
		const cell = (arm: Arm) => {
			const perRound = blocks(arm).map(median);
			return `${ms(median(perRound))} (${ms(quantile(perRound, 0))})`;
		};
		const change = pairedChange(blocks("base"), blocks("head"));
		const noise = pairedChange(blocks("base"), blocks("control"));
		lines.push(
			`| ${label} | ${CLOCK_LABEL[clock]} | ${cell("base")} | ${cell("head")} | ${interval(change)} |${primary ? ` ${verdict(change)} |` : ""} ${interval(noise)} |`,
		);
	}
	return lines;
}

function report(samples: Record<Arm, Sample[]>) {
	const counts = aecSceneCounts(SCENE);
	return (
		[
			"# Viewer timing benchmark",
			"",
			`- Fixture: AEC facade, ${counts.meshes} meshes, ${counts.treeNodes} tree nodes${SCENE.glassBlend ? ", blended glass" : ""}`,
			`- Rounds: ${ROUNDS}. Each round opens base, head and control (base again) side by side and alternates between them block by block.`,
			`- GPU: ${samples.base[0]?.gpu ?? "unknown"}`,
			`- Base: ${process.env.BENCH_BASE ?? "examples/test-cdn/dist"}`,
			`- Head: ${process.env.BENCH_HEAD ?? "examples/test-cdn/dist"}`,
			"",
			"Milliseconds. Base and head: median over the rounds, the fastest round in brackets.",
			"Head vs base: geometric mean of the per-round ratios with a 95% confidence interval. An interval that contains 0 is not distinguishable from noise.",
			"A/A compares two pages of the base build. It is this run's noise floor; its interval should contain 0. If it does not, the machine was too busy: run again.",
			"",
			...table(samples, true),
			"",
			"The same runs on the other clock, for reference:",
			"",
			...table(samples, false),
		].join("\n") + "\n"
	);
}

test("benchmark: base against head on the AEC facade", async ({browser}) => {
	const samples: Record<Arm, Sample[]> = {base: [], head: [], control: []};

	// One discarded load per build fills the HTTP and shader caches.
	for (const origin of [BASE_URL, HEAD_URL]) {
		const viewer = await open(browser, origin);
		await build(viewer);
		await firstFrame(viewer);
		await viewer.page.close();
	}

	for (let index = 0; index < ROUNDS; index++) {
		const result = await round(browser, index);
		for (const arm of Object.keys(samples) as Arm[])
			samples[arm].push(result[arm]);
		console.log(`Round ${index + 1} of ${ROUNDS} done`);
	}

	const markdown = report(samples);
	fs.mkdirSync(OUT_DIR, {recursive: true});
	fs.writeFileSync(path.join(OUT_DIR, "report.md"), markdown);
	fs.writeFileSync(
		path.join(OUT_DIR, "samples.json"),
		JSON.stringify(samples, null, "\t"),
	);
	console.log("\n" + markdown);
});
