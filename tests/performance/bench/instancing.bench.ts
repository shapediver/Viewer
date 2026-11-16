import {test} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {
	INSTANCING_FILES,
	INSTANCING_KINDS,
	INSTANCING_SIZES,
	loadInstancingGlb,
	routeInstancingGlbs,
	type InstancingLoad,
} from "../fixtures/instancingGlbs";
import {openViewer} from "../fixtures/probe";

// The two servers playwright.config.ts starts.
const BASE_URL = "http://127.0.0.1:8195";
const HEAD_URL = "http://127.0.0.1:8196";

/**
 * Compares glb loading with GPU-instancing detection between two builds of
 * examples/test-cdn. Every mesh of a file shares vertex count, index count
 * and material. The output is a Markdown table. Nothing is asserted. See
 * README.md.
 */

const RUNS = Number(process.env.BENCH_RUNS ?? 5);
const OUT_DIR = path.join(__dirname, "../../test-results/bench");

type Sample = Record<string, InstancingLoad>;

function median(values: number[]) {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

async function measure(
	browser: import("@playwright/test").Browser,
	origin: string,
): Promise<Sample> {
	const page = await browser.newPage();
	await openViewer(page, `${origin}/index.html`);
	await routeInstancingGlbs(page);
	const sample: Sample = {};
	for (const file of INSTANCING_FILES)
		sample[file.name] = await loadInstancingGlb(page, file.name);
	await page.close();
	return sample;
}

function summarize(values: number[]) {
	const mid = median(values);
	const min = Math.min(...values);
	const max = Math.max(...values);
	return {median: mid, min, max, spread: (max - min) / mid};
}

const ms = (value: number) => value.toFixed(0);
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function report(base: Sample[], head: Sample[]) {
	const [small, large] = INSTANCING_SIZES;
	const lines = [
		"# GPU-instancing detection benchmark",
		"",
		`- Fixture: synthetic glb, ${small} and ${large} meshes of 64 vertices, one material`,
		`- Runs per build: ${RUNS}, interleaved`,
		`- Base: ${process.env.BENCH_BASE ?? "examples/test-cdn/dist"}`,
		`- Head: ${process.env.BENCH_HEAD ?? "examples/test-cdn/dist"}`,
		"",
		"DataEngine.loadContent wall time in milliseconds. Median of the runs, then min to max. Spread is (max - min) / median.",
		"",
		"| File | Base median | Base min-max | Base spread | Head median | Head min-max | Head spread | Change | Verdict |",
		"| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
	];
	for (const file of INSTANCING_FILES) {
		const b = summarize(base.map((s) => s[file.name].ms));
		const h = summarize(head.map((s) => s[file.name].ms));
		const change = (h.median - b.median) / b.median;
		// Load times are noisy on a busy machine; only ranges that do not
		// overlap at all count as a change.
		const verdict =
			h.max < b.min
				? "faster"
				: h.min > b.max
					? "slower"
					: "within noise";
		lines.push(
			`| ${file.name} | ${ms(b.median)} | ${ms(b.min)}-${ms(b.max)} | ${percent(b.spread)} | ${ms(h.median)} | ${ms(h.min)}-${ms(h.max)} | ${percent(h.spread)} | ${change >= 0 ? "+" : ""}${percent(change)} | ${verdict} |`,
		);
	}
	lines.push(
		"",
		`Growth from ${small} to ${large} meshes (${large / small}x). Linear work grows ${large / small}x, quadratic ${(large / small) ** 2}x. Comparison calls are deterministic.`,
		"",
		"| Kind | Base time | Head time | Base comparison calls | Head comparison calls | Same detection result |",
		"| --- | ---: | ---: | ---: | ---: | --- |",
	);
	for (const kind of INSTANCING_KINDS) {
		const growth = (samples: Sample[], key: "ms" | "comparisonCalls") =>
			median(samples.map((s) => s[`${kind}-${large}`][key])) /
			median(samples.map((s) => s[`${kind}-${small}`][key]));
		const same = INSTANCING_SIZES.every((size) =>
			[...base, ...head].every(
				(s) =>
					s[`${kind}-${size}`].resultHash ===
					base[0][`${kind}-${size}`].resultHash,
			),
		);
		lines.push(
			`| ${kind} | ${growth(base, "ms").toFixed(1)}x | ${growth(head, "ms").toFixed(1)}x | ${growth(base, "comparisonCalls").toFixed(1)}x | ${growth(head, "comparisonCalls").toFixed(1)}x | ${same ? "yes" : "NO"} |`,
		);
	}
	return lines.join("\n") + "\n";
}

test("benchmark: base against head, GPU-instancing detection", async ({
	browser,
}) => {
	const samples: {base: Sample[]; head: Sample[]} = {base: [], head: []};
	const builds = [
		["base", BASE_URL],
		["head", HEAD_URL],
	] as const;

	// One discarded load per build fills the HTTP cache and the JIT.
	for (const [, origin] of builds) await measure(browser, origin);

	for (let run = 0; run < RUNS; run++) {
		// base, head, head, base, ... so drift hits both builds equally.
		const order = run % 2 ? [...builds].reverse() : builds;
		for (const [name, origin] of order)
			samples[name].push(await measure(browser, origin));
	}

	const markdown = report(samples.base, samples.head);
	fs.mkdirSync(OUT_DIR, {recursive: true});
	fs.writeFileSync(path.join(OUT_DIR, "instancing-report.md"), markdown);
	fs.writeFileSync(
		path.join(OUT_DIR, "instancing-samples.json"),
		JSON.stringify(samples, null, "\t"),
	);
	console.log("\n" + markdown);
});
