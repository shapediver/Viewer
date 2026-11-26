import {test, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {AEC_DEFAULT} from "../fixtures/aecScene";
import {type PassRecord, type SceneVariant} from "../fixtures/probe";

/**
 * Budgets for an AEC-like scene with product-default settings.
 *
 * `exact/` checks that a mechanism exists on a toy scene. These tests count
 * what a facade costs: passes, draw calls, triangles, programs, and how much
 * of the tree one change touches. The counts are compared with
 * `baseline/<id>.json`, one file per scenario.
 *
 * A counter above its baseline is a regression. A counter below it also
 * fails, with a request to lower the baseline, so an improvement cannot be
 * lost again unnoticed. `UPDATE_BUDGETS=1` rewrites the baseline.
 *
 * The page clock is faked, so frames advance only when the test says so and
 * the counts do not depend on the speed of the machine.
 */

export const UPDATE = process.env.UPDATE_BUDGETS === "1";

export type Counters = Record<string, number>;
export type Frame = {frame: number; passes: PassRecord[]};

/** Long enough for the beauty delay (50 ms) and blend (1500 ms). */
export const SETTLE_MS = 2500;

/**
 * `PERF_RENDERER=swiftshader` runs Chrome on the software renderer, which
 * turns shadows and the soft-shadow fade off. Its counters differ from the
 * GPU's, so it has its own baseline set in `baseline/swiftshader/`.
 */
export const SOFTWARE_BASELINES = process.env.PERF_RENDERER === "swiftshader";

function baselineFile(id: string) {
	return path.join(
		__dirname,
		"baseline",
		...(SOFTWARE_BASELINES ? ["swiftshader"] : []),
		`${id}.json`,
	);
}

function readBaseline(id: string): Counters | undefined {
	const file = baselineFile(id);
	if (!fs.existsSync(file)) return undefined;
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeBaseline(id: string, counters: Counters) {
	const sorted: Counters = {};
	for (const key of Object.keys(counters).sort()) sorted[key] = counters[key];
	fs.mkdirSync(path.dirname(baselineFile(id)), {recursive: true});
	fs.writeFileSync(
		baselineFile(id),
		JSON.stringify(sorted, null, "\t").replace(/\n/g, "\r\n") + "\r\n",
	);
}

export function compare(id: string, actual: Counters): string[] {
	const baseline = readBaseline(id);
	if (!baseline)
		return [
			`${id}: no baseline. Run with UPDATE_BUDGETS=1 and commit baseline/${id}.json.`,
		];
	const problems: string[] = [];
	for (const key of Object.keys({...baseline, ...actual}).sort()) {
		const expected = baseline[key];
		const value = actual[key];
		if (expected === undefined)
			problems.push(
				`${id}.${key}: ${value} has no baseline. Run with UPDATE_BUDGETS=1.`,
			);
		else if (value === undefined)
			problems.push(
				`${id}.${key}: baseline ${expected}, but the counter was not collected.`,
			);
		else if (value > expected)
			problems.push(
				`${id}.${key}: ${value} is above the baseline ${expected}. This is a regression.`,
			);
		else if (value < expected)
			problems.push(
				`${id}.${key}: ${value} is below the baseline ${expected}. Lower the baseline to ${value} (UPDATE_BUDGETS=1) to keep the improvement.`,
			);
	}
	return problems;
}

/** Per-frame counters. Full-screen passes are counted, scene passes listed. */
export function frameCounters(
	prefix: string,
	frame: Frame | undefined,
): Counters {
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
		// Objects the render-list walk of three.js entered (SS-10606).
		[`${prefix}.renderListVisits`]: scenePasses.reduce(
			(sum, p) => sum + p.renderListVisits,
			0,
		),
	};
	scenePasses.forEach((pass, index) => {
		counters[`${prefix}.scenePass${index}.drawCalls`] = pass.calls;
		counters[`${prefix}.scenePass${index}.triangles`] = pass.triangles;
	});
	return counters;
}

export async function isSoftwareRenderer(page: Page) {
	const gpu = await page.evaluate(() => {
		const gl = document.createElement("canvas").getContext("webgl2");
		const debug = gl?.getExtension("WEBGL_debug_renderer_info");
		return String(
			gl && debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "",
		);
	});
	return /swiftshader|llvmpipe/i.test(gpu);
}

/** Time moves only through runFor. See `collect`. */
export async function settle(page: Page) {
	await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
	await page.clock.runFor(SETTLE_MS);
	// Image decoding is real time. Let late textures arrive before counting.
	await page.waitForTimeout(1500);
	await page.clock.runFor(SETTLE_MS);
}

export async function createScene(
	page: Page,
	variant: SceneVariant,
	options: typeof AEC_DEFAULT = AEC_DEFAULT,
) {
	const gpu = await page.evaluate(
		([v, o]) => {
			const probe = (window as any).__probe;
			probe.countRenderList = true;
			return probe.create(v, o);
		},
		[variant, options] as const,
	);
	test.info().annotations.push({type: "gpu", description: gpu});
}

/** What happened while `action` ran and the viewer settled afterwards. */
export async function measure(
	page: Page,
	prefix: string,
	action: () => Promise<void>,
): Promise<Counters> {
	await page.evaluate(() => {
		(window as any).__probe.reset();
		(window as any).__probe.snapshotMaterials();
	});
	await action();
	// Shader compiles run in real time while the clock is paused, and the
	// viewer draws once they are done (SS-10384). Wait for them, so the
	// frames counted below do not depend on the speed of the driver.
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	const result = await page.evaluate(() => {
		const probe = (window as any).__probe;
		return {
			frames: probe.frames(),
			materials: probe.materialChanges(),
			picks: probe.picks(),
			stats: probe.stats(),
		};
	});
	const frames = result.frames as Frame[];
	return {
		...frameCounters(`${prefix}.firstFrame`, frames[0]),
		...frameCounters(`${prefix}.lastFrame`, frames[frames.length - 1]),
		[`${prefix}.framesRendered`]: frames.length,
		[`${prefix}.programsCompiledInRender`]: frames.reduce(
			(sum, frame) =>
				sum +
				frame.passes.reduce((n, pass) => n + pass.programsCreated, 0),
			0,
		),
		[`${prefix}.materialUpdatesOutsideRender`]:
			result.materials.updatesOutsideRender,
		[`${prefix}.materialsCreated`]: result.materials.created,
		[`${prefix}.raycastCalls`]: result.picks.raycastCalls,
		[`${prefix}.treeDataReads`]: result.picks.treeDataReads,
		[`${prefix}.materialsInScene`]: result.stats.materials,
		[`${prefix}.batchedMeshes`]: result.stats.batchedMeshes,
	};
}

export async function idleRenderCalls(page: Page) {
	await page.evaluate(() => (window as any).__probe.reset());
	await page.clock.runFor(1000);
	return page.evaluate(() => (window as any).__probe.passes.length);
}

export async function finalStats(page: Page, counters: Counters) {
	await page.clock.runFor(500);
	const after = await page.evaluate(() => (window as any).__probe.stats());
	counters["final.programs"] = after.programs;
	counters["final.geometries"] = after.geometries;
	counters["final.textures"] = after.textures;
}

/** One orbit step, so the plain scene has a frame to compare with. */
export async function orbitStep(page: Page) {
	await page.evaluate(() => (window as any).__probe.orbit(1));
	await page.clock.runFor(40);
}
