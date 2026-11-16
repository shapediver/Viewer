import {test, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {AEC_DEFAULT, aecSceneCounts} from "../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../fixtures/probe";

// The two servers playwright.config.ts starts.
const BASE_URL = "http://127.0.0.1:8195";
const HEAD_URL = "http://127.0.0.1:8196";

/**
 * Compares two builds of examples/test-cdn on the AEC fixture.
 * The output is a Markdown table. Nothing is asserted. See README.md.
 */

const RUNS = Number(process.env.BENCH_RUNS ?? 5);
const FRAMES = 40;
const UPDATES = 30;
const OUT_DIR = path.join(__dirname, "../../test-results/bench");
const VARIANT: SceneVariant = {id: "default", shadows: true, ssao: false};

const METRICS = [
	["build", "Full scene build (tree + conversion)"],
	["firstFrame", "First frame, renderer.render"],
	["renderFrame", "Camera frame, renderer.render"],
	["composerFrame", "Camera frame with SSAO, composer + gl.finish"],
	["oneNodeUpdate", "One-node scene update"],
] as const;

type Metric = (typeof METRICS)[number][0];
type Sample = Record<Metric, number> & {gpu: string};

function median(values: number[]) {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

async function measure(page: Page, origin: string): Promise<Sample> {
	await openViewer(page, `${origin}/index.html`);
	const gpu: string = await page.evaluate(
		([variant, options]) =>
			(window as any).__probe.create(variant, options),
		[VARIANT, AEC_DEFAULT] as const,
	);
	const build: number = await page.evaluate(
		() => (window as any).__probe.buildMs.total,
	);

	await page.waitForFunction(
		() => (window as any).__probe.frames().length > 1,
	);
	const firstFrame: number = await page.evaluate(() =>
		(window as any).__probe
			.frames()[0]
			.passes.reduce((sum: number, pass: any) => sum + pass.ms, 0),
	);
	// Let the beauty render finish (50 ms delay, 1500 ms blend).
	await page.waitForTimeout(2500);

	const renderFrame: number[] = await page.evaluate(async (count) => {
		const probe = (window as any).__probe;
		const nextFrame = () =>
			new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
		const samples: number[] = [];
		for (let i = 0; i < count; i++) {
			probe.reset();
			probe.orbit(1);
			await nextFrame();
			const frame = probe.frames()[0];
			if (!frame) continue;
			samples.push(
				frame.passes.reduce(
					(sum: number, pass: any) => sum + pass.ms,
					0,
				),
			);
		}
		return samples;
	}, FRAMES);

	const oneNodeUpdate: number[] = await page.evaluate(async (count) => {
		const probe = (window as any).__probe;
		const samples: number[] = [];
		for (let i = 0; i < count; i++) {
			samples.push(probe.timeOneNodeChange());
			await new Promise((resolve) => requestAnimationFrame(resolve));
		}
		return samples;
	}, UPDATES);

	await page.evaluate(() => (window as any).__probe.addSsao());
	await page.waitForTimeout(2500);
	const composerFrame: number[] = await page.evaluate(async (count) => {
		const probe = (window as any).__probe;
		const composer = probe.viewport.postProcessing.effectComposer;
		if (!composer) return [];
		const timings: number[] = [];
		const original = composer.render.bind(composer);
		composer.render = (...args: unknown[]) => {
			const start = performance.now();
			const result = original(...args);
			// Wait for the GPU, so the sample is a whole frame.
			probe.gl.finish();
			timings.push(performance.now() - start);
			return result;
		};
		const nextFrame = () =>
			new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
		const samples: number[] = [];
		for (let i = 0; i < count; i++) {
			timings.length = 0;
			probe.orbit(1);
			await nextFrame();
			if (timings.length) samples.push(timings[0]);
		}
		composer.render = original;
		return samples;
	}, FRAMES);

	return {
		gpu,
		build,
		firstFrame,
		renderFrame: renderFrame.length ? median(renderFrame) : NaN,
		composerFrame: composerFrame.length ? median(composerFrame) : NaN,
		oneNodeUpdate: median(oneNodeUpdate),
	};
}

function summarize(samples: Sample[], metric: Metric) {
	const values = samples.map((sample) => sample[metric]);
	const mid = median(values);
	const min = Math.min(...values);
	const max = Math.max(...values);
	return {median: mid, min, max, spread: (max - min) / mid};
}

const ms = (value: number) => value.toFixed(2);
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function report(base: Sample[], head: Sample[]) {
	const counts = aecSceneCounts(AEC_DEFAULT);
	const lines = [
		"# Viewer timing benchmark",
		"",
		`- Fixture: AEC facade, ${counts.meshes} meshes, ${counts.treeNodes} tree nodes`,
		`- Runs per build: ${RUNS}, interleaved`,
		`- GPU: ${base[0]?.gpu ?? "unknown"}`,
		`- Base: ${process.env.BENCH_BASE ?? "examples/test-cdn/dist"}`,
		`- Head: ${process.env.BENCH_HEAD ?? "examples/test-cdn/dist"}`,
		"",
		"Milliseconds. Median of the runs, then min to max. Spread is (max - min) / median.",
		"A change smaller than the larger spread is noise.",
		"",
		"| Metric | Base median | Base min-max | Base spread | Head median | Head min-max | Head spread | Change | Verdict |",
		"| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
	];
	for (const [metric, label] of METRICS) {
		const b = summarize(base, metric);
		const h = summarize(head, metric);
		const change = (h.median - b.median) / b.median;
		const noise = Math.max(b.spread, h.spread);
		const verdict =
			Math.abs(change) <= noise
				? "within noise"
				: change < 0
					? "faster"
					: "slower";
		lines.push(
			`| ${label} | ${ms(b.median)} | ${ms(b.min)}-${ms(b.max)} | ${percent(b.spread)} | ${ms(h.median)} | ${ms(h.min)}-${ms(h.max)} | ${percent(h.spread)} | ${change >= 0 ? "+" : ""}${percent(change)} | ${verdict} |`,
		);
	}
	return lines.join("\n") + "\n";
}

test("benchmark: base against head on the AEC facade", async ({browser}) => {
	const samples: {base: Sample[]; head: Sample[]} = {base: [], head: []};
	const builds = [
		["base", BASE_URL],
		["head", HEAD_URL],
	] as const;

	// One discarded load per build fills the HTTP and shader caches.
	for (const [, origin] of builds) {
		const page = await browser.newPage();
		await measure(page, origin);
		await page.close();
	}

	for (let run = 0; run < RUNS; run++) {
		// base, head, head, base, ... so drift hits both builds equally.
		const order = run % 2 ? [...builds].reverse() : builds;
		for (const [name, origin] of order) {
			const page = await browser.newPage();
			samples[name].push(await measure(page, origin));
			await page.close();
		}
	}

	const markdown = report(samples.base, samples.head);
	fs.mkdirSync(OUT_DIR, {recursive: true});
	fs.writeFileSync(path.join(OUT_DIR, "report.md"), markdown);
	fs.writeFileSync(
		path.join(OUT_DIR, "samples.json"),
		JSON.stringify(samples, null, "\t"),
	);
	console.log("\n" + markdown);
});
