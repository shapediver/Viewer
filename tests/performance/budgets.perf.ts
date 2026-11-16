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

// Scenes that are not a rendering variant. Both run without shadows, so they
// also run on a software renderer.
const SCENARIOS = ["interaction", "attributes"];
const BASELINE_IDS = [...VARIANTS.map((v) => v.id), ...SCENARIOS];

const ATTRIBUTE_SCENE = {...AEC_DEFAULT, floors: 4};

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
	for (const id of BASELINE_IDS) {
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

/** Time moves only through runFor. See `collect`. */
async function settle(page: Page) {
	await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
	await page.clock.runFor(SETTLE_MS);
	// Image decoding is real time. Let late textures arrive before counting.
	await page.waitForTimeout(1500);
	await page.clock.runFor(SETTLE_MS);
}

async function createScene(
	page: Page,
	variant: SceneVariant,
	options: typeof AEC_DEFAULT = AEC_DEFAULT,
) {
	const gpu = await page.evaluate(
		([v, o]) => (window as any).__probe.create(v, o),
		[variant, options] as const,
	);
	test.info().annotations.push({type: "gpu", description: gpu});
}

/** What happened while `action` ran and the viewer settled afterwards. */
async function measure(
	page: Page,
	prefix: string,
	action: () => Promise<void>,
): Promise<Counters> {
	await page.evaluate(() => {
		(window as any).__probe.reset();
		(window as any).__probe.snapshotMaterials();
	});
	await action();
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
		[`${prefix}.materialUpdatesOutsideRender`]:
			result.materials.updatesOutsideRender,
		[`${prefix}.materialsCreated`]: result.materials.created,
		[`${prefix}.raycastCalls`]: result.picks.raycastCalls,
		[`${prefix}.treeDataReads`]: result.picks.treeDataReads,
		[`${prefix}.materialsInScene`]: result.stats.materials,
		[`${prefix}.batchedMeshes`]: result.stats.batchedMeshes,
	};
}

async function idleRenderCalls(page: Page) {
	await page.evaluate(() => (window as any).__probe.reset());
	await page.clock.runFor(1000);
	return page.evaluate(() => (window as any).__probe.passes.length);
}

async function finalStats(page: Page, counters: Counters) {
	await page.clock.runFor(500);
	const after = await page.evaluate(() => (window as any).__probe.stats());
	counters["final.programs"] = after.programs;
	counters["final.geometries"] = after.geometries;
	counters["final.textures"] = after.textures;
}

/** One orbit step, so the plain scene has a frame to compare with. */
async function orbitStep(page: Page) {
	await page.evaluate(() => (window as any).__probe.orbit(1));
	await page.clock.runFor(40);
}

/**
 * Hover and select on 3860 meshes. Looks for screen points that hit a glass
 * pane, sweeps the pointer over them, clicks them, and counts the cost.
 */
async function collectInteraction(page: Page): Promise<Counters> {
	await createScene(page, {id: "interaction", shadows: false, ssao: false});
	await page.evaluate(() => (window as any).__probe.setupInteraction());
	await settle(page);

	const box = await page.evaluate(() => (window as any).__probe.canvasRect());
	const corner: [number, number] = [box.x + 2, box.y + 2];
	const points: [number, number][] = [];
	for (let row = 1; row <= 10 && points.length < 3; row++)
		for (let column = 1; column <= 12 && points.length < 3; column++) {
			const x = box.x + (box.width * column) / 13;
			const y = box.y + (box.height * row) / 11;
			await page.evaluate(() => (window as any).__probe.reset());
			await page.mouse.move(x, y);
			await page.clock.runFor(32);
			const picks = await page.evaluate(() =>
				(window as any).__probe.picks(),
			);
			if (picks.events.hoverOn > 0) points.push([x, y]);
		}
	expect(points.length, "no pane was hit by the hover scan").toBe(3);
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	const counters: Counters = {};
	// The first pass creates the effect materials. Count the second one.
	for (const point of points) {
		await page.mouse.move(...point);
		await page.clock.runFor(64);
	}
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	Object.assign(
		counters,
		await measure(page, "hover", async () => {
			for (const point of points) {
				await page.mouse.move(...point);
				await page.clock.runFor(64);
			}
			await page.mouse.move(...corner);
		}),
	);
	counters["hover.events"] = await page.evaluate(() => {
		const events = (window as any).__probe.picks().events;
		return (events.hoverOn ?? 0) * 100 + (events.hoverOff ?? 0);
	});

	// A hover that stays on a pane must not keep the loop busy.
	await page.mouse.move(...points[0]);
	await page.clock.runFor(SETTLE_MS);
	counters["hover.idleRenderCalls"] = await idleRenderCalls(page);
	await page.mouse.move(...corner);
	await page.clock.runFor(SETTLE_MS);

	const click = async (point: [number, number]) => {
		await page.mouse.move(...point);
		await page.clock.runFor(32);
		await page.mouse.down();
		await page.clock.runFor(16);
		await page.mouse.up();
		await page.clock.runFor(64);
	};
	// Warm up the select effect once, then measure select and deselect.
	for (const point of points) await click(point);
	await click(corner);
	await page.clock.runFor(SETTLE_MS);
	Object.assign(
		counters,
		await measure(page, "select", async () => {
			for (const point of points) await click(point);
			await click(corner);
		}),
	);
	counters["select.events"] = await page.evaluate(() => {
		const events = (window as any).__probe.picks().events;
		return (events.selectOn ?? 0) * 100 + (events.selectOff ?? 0);
	});
	counters["select.idleRenderCalls"] = await idleRenderCalls(page);

	await finalStats(page, counters);
	return counters;
}

/**
 * Every item gets two sdTF attributes. The test turns the attribute
 * visualization on, switches the attribute, clears it, and leaves the mode.
 */
async function collectAttributes(page: Page): Promise<Counters> {
	// A smaller tower: the visualization takes minutes on the full one (see
	// the counters). Per-mesh counts are comparable, the totals are not.
	await createScene(
		page,
		{id: "attributes", shadows: false, ssao: false},
		ATTRIBUTE_SCENE,
	);
	await settle(page);
	const counters: Counters = {};
	Object.assign(
		counters,
		await measure(page, "attributes.plain", () => orbitStep(page)),
	);

	await page.evaluate(() => (window as any).__probe.setupAttributes());
	await page.clock.runFor(SETTLE_MS);
	const step = (prefix: string, key: string | null) =>
		measure(page, `attributes.${prefix}`, async () => {
			await page.evaluate(
				(k) => (window as any).__probe.showAttribute(k),
				key,
			);
		});
	Object.assign(counters, await step("show", "load"));
	// Texture decoding and compiles are real time.
	await page.waitForTimeout(500);
	Object.assign(counters, await step("switch", "zone"));
	// No attribute selected. The viewport still renders in attribute mode.
	Object.assign(counters, await step("clear", null));
	// Back to the standard renderer.
	Object.assign(
		counters,
		await measure(page, "attributes.leave", async () => {
			await page.evaluate(() =>
				(window as any).__probe.leaveAttributes(),
			);
		}),
	);
	Object.assign(
		counters,
		await measure(page, "attributes.afterLeave", () => orbitStep(page)),
	);
	counters["attributes.idleRenderCalls"] = await idleRenderCalls(page);

	await finalStats(page, counters);
	return counters;
}

for (const scenario of SCENARIOS) {
	test(`budget: AEC facade, ${scenario}`, async ({page}) => {
		await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
		await openViewer(page);
		if (await isSoftwareRenderer(page)) test.setTimeout(900_000);

		const counters =
			scenario === "interaction"
				? await collectInteraction(page)
				: await collectAttributes(page);
		if (UPDATE) {
			writeBaseline(scenario, counters);
			return;
		}
		expect(compare(scenario, counters).join("\n")).toBe("");
	});
}
