import {expect, test, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {AEC_DEFAULT, aecSceneCounts} from "./fixtures/aecScene";
import {openViewer, type PassRecord, type SceneVariant} from "./fixtures/probe";

/**
 * Budgets for an AEC-like scene with product-default settings.
 *
 * `exact.perf.ts` checks that a mechanism exists on a toy scene. These
 * tests count what a facade costs: passes, draw calls, triangles, programs,
 * and how much of the tree one change touches. The counts are compared with
 * `budgets.baseline.json`.
 *
 * A counter above its baseline is a regression. A counter below it also
 * fails, with a request to lower the baseline, so an improvement cannot be
 * lost again unnoticed. `UPDATE_BUDGETS=1` rewrites the baseline.
 *
 * The page clock is faked, so frames advance only when the test says so and
 * the counts do not depend on the speed of the machine.
 */

const BASELINE_FILE = path.join(__dirname, "budgets.baseline.json");
const UPDATE = process.env.UPDATE_BUDGETS === "1";

const VARIANTS: SceneVariant[] = [
	{id: "default", shadows: true, ssao: false},
	{id: "ssao", shadows: true, ssao: true},
	// SwiftShader disables shadows in this viewer. These two run there too.
	{id: "noShadows", shadows: false, ssao: false},
	{id: "noShadowsSsao", shadows: false, ssao: true},
];

type Counters = Record<string, number>;
type Frame = {frame: number; passes: PassRecord[]};

/** Long enough for the beauty delay (50 ms) and blend (1500 ms). */
const SETTLE_MS = 2500;

function readBaseline(): Record<string, Counters> {
	if (!fs.existsSync(BASELINE_FILE)) return {};
	return JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
}

function writeBaseline(variant: string, counters: Counters) {
	const baseline = readBaseline();
	baseline[variant] = counters;
	const sorted: Record<string, Counters> = {};
	for (const id of VARIANTS.map((v) => v.id)) {
		if (!baseline[id]) continue;
		sorted[id] = {};
		for (const key of Object.keys(baseline[id]).sort())
			sorted[id][key] = baseline[id][key];
	}
	fs.writeFileSync(
		BASELINE_FILE,
		JSON.stringify(sorted, null, "\t").replace(/\n/g, "\r\n") + "\r\n",
	);
}

function compare(variant: string, actual: Counters): string[] {
	const baseline = readBaseline()[variant];
	if (!baseline)
		return [
			`${variant}: no baseline. Run with UPDATE_BUDGETS=1 and commit budgets.baseline.json.`,
		];
	const problems: string[] = [];
	for (const key of Object.keys({...baseline, ...actual}).sort()) {
		const expected = baseline[key];
		const value = actual[key];
		if (expected === undefined)
			problems.push(
				`${variant}.${key}: ${value} has no baseline. Run with UPDATE_BUDGETS=1.`,
			);
		else if (value === undefined)
			problems.push(
				`${variant}.${key}: baseline ${expected}, but the counter was not collected.`,
			);
		else if (value > expected)
			problems.push(
				`${variant}.${key}: ${value} is above the baseline ${expected}. This is a regression.`,
			);
		else if (value < expected)
			problems.push(
				`${variant}.${key}: ${value} is below the baseline ${expected}. Lower the baseline to ${value} (UPDATE_BUDGETS=1) to keep the improvement.`,
			);
	}
	return problems;
}

/** Per-frame counters. Full-screen passes are counted, scene passes listed. */
function frameCounters(prefix: string, frame: Frame | undefined): Counters {
	const passes = frame?.passes ?? [];
	const scenePasses = passes.filter((pass) => pass.main);
	const counters: Counters = {
		[`${prefix}.passes`]: passes.length,
		[`${prefix}.scenePasses`]: scenePasses.length,
		[`${prefix}.fullScreenPasses`]: passes.length - scenePasses.length,
		[`${prefix}.drawCalls`]: passes.reduce((sum, p) => sum + p.calls, 0),
		[`${prefix}.triangles`]: passes.reduce(
			(sum, p) => sum + p.triangles,
			0,
		),
		// three.js dirties a transparent double-sided material twice per draw.
		[`${prefix}.materialUpdatesInRender`]: passes.reduce(
			(sum, p) => sum + p.materialUpdates,
			0,
		),
	};
	scenePasses.forEach((pass, index) => {
		counters[`${prefix}.scenePass${index}.drawCalls`] = pass.calls;
		counters[`${prefix}.scenePass${index}.triangles`] = pass.triangles;
	});
	return counters;
}

async function isSoftwareRenderer(page: Page) {
	const gpu = await page.evaluate(() => {
		const gl = document.createElement("canvas").getContext("webgl2");
		const debug = gl?.getExtension("WEBGL_debug_renderer_info");
		return String(
			gl && debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "",
		);
	});
	return /swiftshader|llvmpipe/i.test(gpu);
}

async function collect(page: Page, variant: SceneVariant): Promise<Counters> {
	const gpu = await page.evaluate(
		([v, options]) => (window as any).__probe.create(v, options),
		[variant, AEC_DEFAULT] as const,
	);
	test.info().annotations.push({type: "gpu", description: gpu});
	// From here on time moves only through runFor. Without the pause the
	// clock also follows real time and the frame counts vary per run.
	await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
	await page.clock.runFor(SETTLE_MS);
	// Image decoding is real time. Let late textures arrive before counting.
	await page.waitForTimeout(1500);
	await page.clock.runFor(SETTLE_MS);

	const stats = await page.evaluate(() => (window as any).__probe.stats());
	const expected = aecSceneCounts(AEC_DEFAULT);
	// The generator and the viewer must agree before any budget means much.
	expect(
		await page.evaluate(() => {
			const aec = (window as any).__probe.aec;
			return {meshes: aec.meshes, treeNodes: aec.treeNodes};
		}),
	).toEqual({meshes: expected.meshes, treeNodes: expected.treeNodes});

	const counters: Counters = {};
	// Programs, geometries and textures are counted at the end (`final.*`).
	// Some are created lazily during the first camera move, so a count taken
	// here flips by one between runs.
	const lazy = ["programs", "geometries", "textures"];
	for (const [key, value] of Object.entries(stats))
		if (!lazy.includes(key)) counters[`scene.${key}`] = value as number;

	// 1 s without input.
	await page.evaluate(() => (window as any).__probe.reset());
	await page.clock.runFor(1000);
	counters["idle.renderCalls"] = await page.evaluate(
		() => (window as any).__probe.passes.length,
	);

	// A camera drag, then the beauty render that follows it.
	await page.evaluate(() => {
		(window as any).__probe.reset();
		(window as any).__probe.snapshotMaterials();
	});
	await page.mouse.move(600, 360);
	await page.mouse.down();
	for (let step = 1; step <= 4; step++) {
		await page.mouse.move(600 + step * 20, 360 + step * 10);
		await page.clock.runFor(32);
	}
	await page.mouse.up();
	await page.clock.runFor(SETTLE_MS);
	const move = await page.evaluate(() => ({
		frames: (window as any).__probe.frames(),
		materials: (window as any).__probe.materialChanges(),
	}));
	const frames = move.frames as Frame[];
	expect(frames.length, "the camera drag did not render").toBeGreaterThan(1);
	Object.assign(
		counters,
		frameCounters("cameraFrame", frames[0]),
		frameCounters("beautyFrame", frames[frames.length - 1]),
	);
	// Frames from the first drag step to the end of the beauty blend.
	counters["cameraMove.framesRendered"] = frames.length;
	counters["cameraMove.materialUpdatesOutsideRender"] =
		move.materials.updatesOutsideRender;
	counters["cameraMove.materialsCreated"] = move.materials.created;

	// One hidden glass pane.
	const change = await page.evaluate(() =>
		(window as any).__probe.oneNodeChange(),
	);
	counters["oneNodeChange.treeNodesReversioned"] = change.reversioned;
	counters["oneNodeChange.treeNodesRead"] = change.nodesRead;

	// After everything above, so late compiles and uploads are included.
	await page.clock.runFor(500);
	const after = await page.evaluate(() => (window as any).__probe.stats());
	counters["final.programs"] = after.programs;
	counters["final.geometries"] = after.geometries;
	counters["final.textures"] = after.textures;
	return counters;
}

for (const variant of VARIANTS) {
	test(`budget: AEC facade, ${variant.id}`, async ({page}) => {
		await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
		await openViewer(page);
		const software = await isSoftwareRenderer(page);
		test.skip(
			variant.shadows && software,
			"This viewer disables shadows on a software renderer.",
		);
		// Full-resolution ambient occlusion over ~160 frames is slow in software.
		if (software) test.setTimeout(900_000);

		const counters = await collect(page, variant);
		if (UPDATE) {
			writeBaseline(variant.id, counters);
			return;
		}
		expect(compare(variant.id, counters).join("\n")).toBe("");
	});
}
