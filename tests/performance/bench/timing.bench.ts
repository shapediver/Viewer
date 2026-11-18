import {test, type Browser, type CDPSession, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {AEC_DEFAULT, aecSceneCounts} from "../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../fixtures/probe";
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
 * Compares two builds of examples/test-cdn on the AEC fixture.
 * The output is a Markdown table. Nothing is asserted. See README.md.
 */

const ROUNDS = Number(process.env.BENCH_RUNS ?? 6);
/** BENCH_GLASS_BLEND=1: the glass is glTF BLEND (transparent, no depth write). */
const SCENE = {
	...AEC_DEFAULT,
	glassBlend: process.env.BENCH_GLASS_BLEND === "1",
};
/**
 * The pages take turns block by block. Many short blocks pair better than a
 * few long ones: load from other programs comes in bursts of seconds.
 * Update and SSAO blocks wait for the beauty render afterwards, so they are
 * fewer.
 */
const RENDER_BLOCKS = 12;
const RENDERS_PER_BLOCK = 2;
const UPDATE_BLOCKS = 8;
/** Even, so every block leaves the scene as it found it. */
const UPDATES_PER_BLOCK = 4;
const SSAO_BLOCKS = 4;
const SSAO_FRAMES_PER_BLOCK = 4;
const VERSION_BLOCKS = 8;
const VERSION_UPDATES_PER_BLOCK = 2;
const OUT_DIR = path.join(__dirname, "../../test-results/bench");
const VARIANT: SceneVariant = {id: "default", shadows: true, ssao: false};

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

type Clock = "cpu" | "wall";
/**
 * Name, label, and the clock the main table uses. The first frame uses CPU
 * time although shader compilation runs in the GPU process: the three pages
 * share that process and its program cache, so the wall time of a first
 * frame depends on which page compiled first and was twice as noisy.
 */
const METRICS = [
	["build", "Full scene build (tree + conversion)", "cpu"],
	["firstFrame", "First frame", "cpu"],
	["renderFrame", "Camera frame, renderer.render", "cpu"],
	["oneNodeUpdate", "One-node scene update", "cpu"],
	["composerFrame", "Camera frame with SSAO, until the GPU is done", "wall"],
	["versionUpdate", "Fixture version update", "cpu"],
] as const;
type Metric = (typeof METRICS)[number][0];

/** One value per block, for each clock. Build and first frame have one block. */
type Blocks = Record<Clock, number[]>;
type Sample = Record<Metric, Blocks> & {gpu: string};

interface Viewer {
	page: Page;
	cdp: CDPSession;
	gpu: string;
}

/**
 * Waits until the viewer has drawn nothing for 10 frames, so a page that
 * finishes its beauty render does not run while another page is measured.
 */
async function settle(viewer: Viewer) {
	await viewer.page.evaluate(async () => {
		const probe = (window as any).__probe;
		const frame = () =>
			new Promise((resolve) => requestAnimationFrame(resolve));
		const start = performance.now();
		let quiet = 0;
		let seen = probe.passes.length;
		while (quiet < 10 && performance.now() - start < 10_000) {
			await frame();
			if (probe.passes.length === seen) quiet++;
			else [quiet, seen] = [0, probe.passes.length];
		}
		probe.reset();
	});
}

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

async function build(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate(
			(options) => (window as any).__probe.build(options).total,
			SCENE,
		),
	);
	return {cpu, wall: result as number};
}

async function firstFrame(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate(async (variant) => {
			const probe = (window as any).__probe;
			probe.show(variant);
			while (!probe.frames().length)
				await new Promise((resolve) => requestAnimationFrame(resolve));
			return probe
				.frames()[0]
				.passes.reduce((sum: number, pass: any) => sum + pass.ms, 0);
		}, VARIANT),
	);
	await settle(viewer);
	return {cpu, wall: result as number};
}

/**
 * `renderer.render` of the viewport scene, called directly. The camera does
 * not move, so the viewer does not draw on its own afterwards.
 */
async function renderBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate((count) => {
			const probe = (window as any).__probe;
			const camera = probe.viewport.threeJsCoreObjects.camera;
			const samples: number[] = [];
			for (let i = 0; i < count; i++) {
				const start = performance.now();
				probe.renderer.render(probe.scene, camera);
				samples.push(performance.now() - start);
			}
			return samples;
		}, RENDERS_PER_BLOCK),
	);
	return {cpu: cpu / RENDERS_PER_BLOCK, wall: median(result)};
}

async function updateBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate((count) => {
			const probe = (window as any).__probe;
			const samples: number[] = [];
			for (let i = 0; i < count; i++)
				samples.push(probe.timeOneNodeChange());
			return samples;
		}, UPDATES_PER_BLOCK),
	);
	await settle(viewer);
	return {cpu: cpu / UPDATES_PER_BLOCK, wall: median(result)};
}

/**
 * SSAO camera frames drawn by the viewer. `wall` runs from the start of
 * `effectComposer.render` until a one-pixel `readPixels` returns, which
 * waits for the GPU. `gl.finish()` does not: on ANGLE with Direct3D 11 it
 * returns after about 2 ms. `cpu` is main-thread CPU time per frame.
 */
async function ssaoBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate(async (count) => {
			const probe = (window as any).__probe;
			const gl: WebGL2RenderingContext = probe.gl;
			const composer = probe.viewport.postProcessing.effectComposer;
			if (!composer) return [];
			const pixel = new Uint8Array(4);
			const timings: number[] = [];
			const original = composer.render.bind(composer);
			composer.render = (...args: unknown[]) => {
				const start = performance.now();
				const result = original(...args);
				gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
				timings.push(performance.now() - start);
				return result;
			};
			const samples: number[] = [];
			for (let i = 0; i < count; i++) {
				timings.length = 0;
				probe.orbit(1);
				await new Promise((resolve) =>
					requestAnimationFrame(() => requestAnimationFrame(resolve)),
				);
				if (timings.length) samples.push(timings[0]);
			}
			composer.render = original;
			return samples;
		}, SSAO_FRAMES_PER_BLOCK),
	);
	await settle(viewer);
	return {cpu: cpu / SSAO_FRAMES_PER_BLOCK, wall: median(result)};
}

/**
 * `updateVersion()` on the fixture root, as adding a session does. No scene
 * update follows, so the blocks only re-version the tree. Measured last:
 * the next scene update would convert the whole fixture again.
 */
async function versionBlock(viewer: Viewer) {
	const {cpu, result} = await cpuOf(viewer.cdp, () =>
		viewer.page.evaluate((count) => {
			const root = (window as any).__probe.aec.root;
			const samples: number[] = [];
			for (let i = 0; i < count; i++) {
				const start = performance.now();
				root.updateVersion();
				samples.push(performance.now() - start);
			}
			return samples;
		}, VERSION_UPDATES_PER_BLOCK),
	);
	await settle(viewer);
	return {cpu: cpu / VERSION_UPDATES_PER_BLOCK, wall: median(result)};
}

const STEPS: [
	Metric,
	(viewer: Viewer) => Promise<Record<Clock, number>>,
	number,
][] = [
	["build", build, 1],
	["firstFrame", firstFrame, 1],
	["renderFrame", renderBlock, RENDER_BLOCKS],
	["oneNodeUpdate", updateBlock, UPDATE_BLOCKS],
	["composerFrame", ssaoBlock, SSAO_BLOCKS],
	["versionUpdate", versionBlock, VERSION_BLOCKS],
];

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
